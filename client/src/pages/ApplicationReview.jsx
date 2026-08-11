import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import MapView from "../components/MapView.jsx";

function ApplicationReview() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              <div className="mt-4">
                <MapView position={[parseFloat(app.latitude), parseFloat(app.longitude)]} height="250px" />
              </div>
            )}

            {app.custom_sport && !app.sport_category_id && (
              <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Owner proposed a new sport: <strong>{app.custom_sport}</strong> (can be added on approval).
              </p>
            )}

            <p className="mt-6 text-sm text-gray-400">Approve / reject actions come in the next step.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationReview;