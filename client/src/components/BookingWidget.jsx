import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const fmt = (h) => `${String(h).padStart(2, "0")}:00`;

function BookingWidget({ turf }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmtDate(new Date());
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 6); // today + 6 = 7-day window
  const maxDate = fmtDate(maxDateObj);

  const openHour = parseInt(turf.opening_time.slice(0, 2), 10);
  const closeHour = parseInt(turf.closing_time.slice(0, 2), 10);
  const allSlots = [];
  for (let h = openHour; h < closeHour; h++) allSlots.push(h);
  const maxDur = turf.max_booking_duration || 3;

  const [date, setDate] = useState(today);
  const [taken, setTaken] = useState([]);      // booked + blocked hours
  const [startHour, setStartHour] = useState(null);
  const [duration, setDuration] = useState(1);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const loadAvailability = async () => {
    try {
      const res = await axios.get(`/bookings/availability?turfId=${turf.id}&date=${date}`);
      const hrs = [...res.data.booked, ...res.data.blocked].map((t) => parseInt(t.slice(0, 2), 10));
      setTaken(hrs);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadAvailability();
    setStartHour(null);
    setMsg(""); setErr("");
  }, [date]);

  const nowHour = new Date().getHours();
  const isToday = date === today;
  const isPast = (h) => isToday && h <= nowHour; // slot has started or passed

  const isTaken = (h) => taken.includes(h);

  const rangeFree = () => {
    if (startHour == null) return false;
    if (startHour + duration > closeHour) return false;
    for (let h = startHour; h < startHour + duration; h++) {
      if (!allSlots.includes(h) || isTaken(h) || isPast(h)) return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/turfs/${turf.id}` } } });
      return;
    }
    setBusy(true); setMsg(""); setErr("");
    try {
      // 1. reserve slots + create the Razorpay order
      const { data } = await axios.post("/payments/order", {
        turfId: turf.id, date, startHour, durationHours: duration,
      });

      // 2. open Razorpay checkout
      const options = {
        key: data.key,
        amount: data.amount,
        currency: "INR",
        name: "Reservation Portal",
        description: `${turf.name} booking`,
        order_id: data.orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#16a34a" },
        handler: async (response) => {
          // 3. verify the payment on success
          try {
            await axios.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: data.bookingId,
            });
            setMsg("Payment successful! Booking confirmed.");
            setStartHour(null);
            loadAvailability();
          } catch {
            setErr("Payment verification failed. Please contact support.");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: async () => {
            // released the held slot if they close without paying
            await axios.post("/payments/cancel", { bookingId: data.bookingId });
            loadAvailability();
            setBusy(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setErr(e.response?.data?.message || "Could not start payment");
      loadAvailability();
      setBusy(false);
    }
  };

  const total = (turf.price_per_hour / 100) * duration;

  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold text-gray-900">Book this turf</h3>

      <label className="text-sm text-gray-600">Date</label>
      <input type="date" min={today} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)}
        className="mb-3 block rounded-lg border border-gray-300 px-3 py-2" />

      <div className="mb-3 flex flex-wrap gap-2">
        {allSlots.map((h) => {
          const disabled = isTaken(h) || isPast(h);
          return (
            <button key={h} type="button" disabled={disabled} onClick={() => setStartHour(h)}
              className={`rounded px-3 py-1 text-sm ${
                disabled
                  ? "cursor-not-allowed bg-gray-200 text-gray-400 line-through"
                  : startHour === h
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              {fmt(h)}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm text-gray-600">Duration</label>
        <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-1">
          {Array.from({ length: maxDur }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d} hour{d > 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>

      {startHour != null && (
        <p className="mb-2 text-sm text-gray-700">
          {fmt(startHour)}–{fmt(startHour + duration)} · ₹{total.toFixed(0)}
          {!rangeFree() && <span className="ml-2 text-red-600">range not available</span>}
        </p>
      )}

      {msg && <p className="mb-2 text-sm text-green-700">{msg}</p>}
      {err && <p className="mb-2 text-sm text-red-600">{err}</p>}

      <button onClick={handleBook} disabled={busy || (user && !rangeFree())}
        className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
        {busy ? "Processing..." : user ? "Book & Pay" : "Login to book"}
      </button>

      <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="font-medium text-gray-600">Cancellation policy:</span> Full refund if cancelled
        more than 24 hours before the slot · 50% refund between 6–24 hours · no refund within 6 hours or for no-shows.
      </p>
    </div>
  );
}

export default BookingWidget;