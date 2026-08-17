import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import Navbar from "../components/Navbar.jsx";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportingId, setReportingId] = useState(null);
  const [issueType, setIssueType] = useState("turf_closed");
  const [issueDesc, setIssueDesc] = useState("");
  const [ratingId, setRatingId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [qrShownId, setQrShownId] = useState(null);
  const [qrData, setQrData] = useState("");

  const showQR = async (b) => {
    if (qrShownId === b.id) { setQrShownId(null); return; }
    try {
      const url = await QRCode.toDataURL(b.checkin_token, { width: 220 });
      setQrData(url);
      setQrShownId(b.id);
    } catch {
      /* ignore */
    }
  };

  const load = async () => {
    try {
      const res = await axios.get("/bookings/my");
      setBookings(res.data.bookings);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const downloadReceipt = async (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Reservation Portal", 20, 20);
    doc.setFontSize(12); doc.text("Booking Receipt", 20, 30);
    doc.line(20, 34, 190, 34);
    let y = 45;
    const line = (l, v) => { doc.text(`${l}: ${v}`, 20, y); y += 8; };
    line("Booking ID", String(b.id));
    line("Turf", b.turf_name);
    line("Date", new Date(b.booking_date).toLocaleDateString());
    line("Time", `${b.start_time?.slice(0,5)} - ${b.end_time?.slice(0,5)}`);
    line("Amount", `Rs. ${(b.total_amount/100).toFixed(0)}`);
    line("Status", b.status);
    try {
      const qr = await QRCode.toDataURL(b.checkin_token, { width: 200 });
      doc.addImage(qr, "PNG", 140, 40, 45, 45);
      doc.setFontSize(9); doc.text("Check-in QR", 150, 90);
    } catch { /* ignore */ }
    doc.save(`receipt-${b.id}.pdf`);
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking? Refund depends on how early you cancel (100% >24h, 50% 6–24h, 0% <6h).")) return;
    try {
      const res = await axios.patch(`/bookings/${id}/cancel`);
      alert(res.data.message);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Cancel failed");
    }
  };

  const submitReport = async (bookingId) => {
    try {
      await axios.post("/disputes", { bookingId, type: issueType, description: issueDesc });
      alert("Issue reported. Our team will review it.");
      setReportingId(null); setIssueDesc(""); setIssueType("turf_closed");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to report");
    }
  };

  const submitRating = async (bookingId) => {
    try {
      await axios.post("/reviews", { bookingId, rating: ratingValue, comment: ratingComment });
      alert("Thanks for your review!");
      setRatingId(null); setRatingValue(5); setRatingComment("");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit review");
    }
  };

  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">My Bookings</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && bookings.length === 0 && <p className="text-gray-500">No bookings yet.</p>}

        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.turf_name}</h3>
                  <p className="text-sm text-gray-500">{b.location_address}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(b.booking_date).toLocaleDateString()} · {b.start_time?.slice(0,5)}–{b.end_time?.slice(0,5)} · ₹{(b.total_amount/100).toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{b.status}</span>
                  <button onClick={() => downloadReceipt(b)} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">Receipt</button>
                  {b.status === "confirmed" && (
                    <>
                      <button onClick={() => showQR(b)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                        Check-in QR
                      </button>
                      <button onClick={() => cancelBooking(b.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Cancel</button>
                      <button onClick={() => setReportingId(reportingId === b.id ? null : b.id)} className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600">Report Issue</button>
                      <button onClick={() => setRatingId(ratingId === b.id ? null : b.id)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                        Rate
                      </button>
                    </>
                  )}
                </div>
              </div>

              {reportingId === b.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={input}>
                    <option value="turf_closed">Turf was closed</option>
                    <option value="unavailable">Turf unavailable</option>
                    <option value="not_as_described">Not as described</option>
                    <option value="double_booked">Double booked</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} rows="2" placeholder="Describe the issue" className={input} />
                  <div className="flex gap-2">
                    <button onClick={() => submitReport(b.id)} className="rounded-lg bg-yellow-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-yellow-600">Submit report</button>
                    <button onClick={() => setReportingId(null)} className="rounded-lg bg-gray-200 px-4 py-1.5 text-sm text-gray-700">Cancel</button>
                  </div>
                </div>
              )}

              {ratingId === b.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <div className="flex gap-1 text-2xl">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} type="button" onClick={() => setRatingValue(s)}
                        className={s <= ratingValue ? "text-yellow-500" : "text-gray-300"}>★</button>
                    ))}
                  </div>
                  <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} rows="2"
                    placeholder="Leave a comment (optional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => submitRating(b.id)} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700">Submit review</button>
                    <button onClick={() => setRatingId(null)} className="rounded-lg bg-gray-200 px-4 py-1.5 text-sm text-gray-700">Cancel</button>
                  </div>
                </div>
              )}

              {qrShownId === b.id && (
                <div className="mt-3 flex flex-col items-center border-t pt-3">
                  <img src={qrData} alt="Check-in QR" className="h-48 w-48" />
                  <p className="mt-2 text-xs text-gray-500">Show this QR at the turf to check in.</p>
                  {b.checked_in ? (
                    <p className="text-xs font-medium text-green-600">Already checked in ✓</p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;