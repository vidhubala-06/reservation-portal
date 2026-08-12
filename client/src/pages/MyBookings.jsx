import { useEffect, useState } from "react";
import axios from "axios";
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
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;