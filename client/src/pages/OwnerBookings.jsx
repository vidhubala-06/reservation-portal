import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const q = date ? `?date=${date}` : "";
      const res = await axios.get(`/owner/bookings${q}`);
      setBookings(res.data.bookings);
    } catch {
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const downloadCSV = () => {
    if (bookings.length === 0) return;
    const headers = ["Turf", "Date", "Time", "Duration", "Customer", "Email", "Phone", "Amount", "Status"];
    const rows = bookings.map((b) => [
      b.turf_name,
      new Date(b.booking_date).toLocaleDateString(),
      `${b.start_time?.slice(0, 5)}-${b.end_time?.slice(0, 5)}`,
      `${b.duration_hours}h`,
      b.customer_name,
      b.customer_email,
      b.customer_phone || "",
      (b.total_amount / 100).toFixed(0),
      b.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings${date ? "-" + date : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2" />
            {date && (
              <button onClick={() => setDate("")} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
            )}
            <button onClick={downloadCSV} disabled={bookings.length === 0}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
              Download CSV
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && bookings.length === 0 && (
          <p className="text-gray-500">No bookings{date ? " for this date" : ""}.</p>
        )}

        {bookings.length > 0 && (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3">Turf</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{b.turf_name}</td>
                    <td className="px-4 py-3">{new Date(b.booking_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)}</td>
                    <td className="px-4 py-3">{b.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500">{b.customer_phone || b.customer_email}</td>
                    <td className="px-4 py-3">₹{(b.total_amount / 100).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerBookings;