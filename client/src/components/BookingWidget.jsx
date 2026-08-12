import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const fmt = (h) => `${String(h).padStart(2, "0")}:00`;

function BookingWidget({ turf }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

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

  const isTaken = (h) => taken.includes(h);

  const rangeFree = () => {
    if (startHour == null) return false;
    if (startHour + duration > closeHour) return false;
    for (let h = startHour; h < startHour + duration; h++) {
      if (!allSlots.includes(h) || isTaken(h)) return false;
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
      await axios.post("/bookings", { turfId: turf.id, date, startHour, durationHours: duration });
      setMsg("Booking confirmed!");
      setStartHour(null);
      loadAvailability();
    } catch (e) {
      setErr(e.response?.data?.message || "Booking failed");
      loadAvailability();
    } finally {
      setBusy(false);
    }
  };

  const total = (turf.price_per_hour / 100) * duration;

  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 font-semibold text-gray-900">Book this turf</h3>

      <label className="text-sm text-gray-600">Date</label>
      <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
        className="mb-3 block rounded-lg border border-gray-300 px-3 py-2" />

      <div className="mb-3 flex flex-wrap gap-2">
        {allSlots.map((h) => (
          <button key={h} type="button" disabled={isTaken(h)} onClick={() => setStartHour(h)}
            className={`rounded px-3 py-1 text-sm ${
              isTaken(h)
                ? "cursor-not-allowed bg-gray-200 text-gray-400 line-through"
                : startHour === h
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {fmt(h)}
          </button>
        ))}
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
        {busy ? "Booking..." : user ? "Confirm Booking" : "Login to book"}
      </button>
    </div>
  );
}

export default BookingWidget;