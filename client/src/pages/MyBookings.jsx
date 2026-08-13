import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import Navbar from "../components/Navbar.jsx";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/bookings/my");
        setBookings(res.data.bookings);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadReceipt = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reservation Portal", 20, 20);
    doc.setFontSize(12);
    doc.text("Booking Receipt", 20, 30);
    doc.line(20, 34, 190, 34);

    let y = 45;
    const line = (label, value) => { doc.text(`${label}: ${value}`, 20, y); y += 8; };
    line("Booking ID", String(b.id));
    line("Turf", b.turf_name);
    line("Location", b.location_address || "-");
    line("Date", new Date(b.booking_date).toLocaleDateString());
    line("Time", `${b.start_time?.slice(0, 5)} - ${b.end_time?.slice(0, 5)}`);
    line("Duration", `${b.duration_hours} hour(s)`);
    line("Amount", `Rs. ${(b.total_amount / 100).toFixed(0)}`);
    line("Status", b.status);

    y += 6;
    doc.setFontSize(10);
    doc.text("Thank you for booking with Reservation Portal.", 20, y);
    doc.save(`receipt-${b.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">My Bookings</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && bookings.length === 0 && <p className="text-gray-500">No bookings yet.</p>}
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <h3 className="font-semibold text-gray-900">{b.turf_name}</h3>
                <p className="text-sm text-gray-500">{b.location_address}</p>
                <p className="text-sm text-gray-600">
                  {new Date(b.booking_date).toLocaleDateString()} · {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)} · ₹{(b.total_amount / 100).toFixed(0)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{b.status}</span>
                <button onClick={() => downloadReceipt(b)}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
                  Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;