import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/admin/applications/${id}`);
        setApp(res.data.application);
      } catch (err) {
        setError(err.response?.status === 404 ? "Application not found" : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const hasLocation = app && app.latitude && app.longitude;

  const handleApprove = async () => {
    setBusy(true); setActionError("");
    try {
      await axios.patch(`/admin/applications/${id}/approve`);
      alert("Approved — turf created and user upgraded to owner.");
      navigate("/admin");
    } catch (err) {
      setActionError(err.response?.data?.message || "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) { setActionError("Please enter a reason"); return; }
    setBusy(true); setActionError("");
    try {
      await axios.patch(`/admin/applications/${id}/reject`, { reason });
      alert("Application rejected.");
      navigate("/admin");
    } catch (err) {
      setActionError(err.response?.data?.message || "Reject failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {app && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">{app.turf_name}</h2>
            <p className="mt-1 text-gray-500">{app.sport} · {app.size}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500">Applicant:</span> {app.applicant_name}</p>
              <p><span className="text-gray-500">Email:</span> {app.applicant_email}</p>
              <p><span className="text-gray-500">Phone:</span> {app.applicant_phone || "—"}</p>
              <p><span className="text-gray-500">PAN:</span> {app.pan_number || "—"}</p>
              <p><span className="text-gray-500">Business:</span> {app.business_name || "—"}</p>
              <p><span className="text-gray-500">Price/hr:</span> ₹{(app.price_per_hour / 100).toFixed(0)}</p>
              <p><span className="text-gray-500">Hours:</span> {app.opening_time?.slice(0, 5)}–{app.closing_time?.slice(0, 5)}</p>
              <p><span className="text-gray-500">Surface:</span> {app.surface_type || "—"}</p>
            </div>

            <p className="mt-3 text-sm"><span className="text-gray-500">Address:</span> {app.location_address}</p>

            {app.amenityNames?.length > 0 && (
              <p className="mt-2 text-sm"><span className="text-gray-500">Amenities:</span> {app.amenityNames.join(", ")}</p>
            )}
            {app.other_amenities && (
              <p className="mt-1 text-sm"><span className="text-gray-500">Other:</span> {app.other_amenities}</p>
            )}

            {app.photos?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {app.photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-28 w-28 rounded object-cover" />
                ))}
              </div>
            )}

            {hasLocation && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${app.latitude},${app.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                📍 View location on Google Maps
              </a>
            )}

            {app.custom_sport && !app.sport_category_id && (
              <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Proposed new sport: <strong>{app.custom_sport}</strong> — will be added to the list on approval.
              </p>
            )}

            {actionError && <p className="mt-4 text-sm text-red-600">{actionError}</p>}

            {!rejectMode ? (
              <div className="mt-6 flex gap-3">
                <button onClick={handleApprove} disabled={busy}
                  className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {busy ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => setRejectMode(true)} disabled={busy}
                  className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  Reject
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for rejection (emailed to the applicant)"
                  rows="3" className="w-full rounded-lg border border-gray-300 px-4 py-2" />
                <div className="mt-2 flex gap-3">
                  <button onClick={handleReject} disabled={busy}
                    className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    {busy ? "Rejecting..." : "Confirm Reject"}
                  </button>
                  <button onClick={() => setRejectMode(false)} disabled={busy}
                    className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationReview;