import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import MapView from "../components/MapView.jsx";
import BookingWidget from "../components/BookingWidget.jsx";

function TurfDetail() {
  const { id } = useParams();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/turfs/${id}`);
        setTurf(res.data.turf);
      } catch (err) {
        setError(err.response?.status === 404 ? "Turf not found" : "Failed to load turf");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    axios.get(`/reviews/turf/${id}`).then((r) => setReviews(r.data.reviews)).catch(() => {});
  }, [id]);

  const hasLocation = turf && turf.latitude && turf.longitude;
  const position = hasLocation ? [parseFloat(turf.latitude), parseFloat(turf.longitude)] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {turf && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            {/* Image gallery */}
            {turf.images?.length > 0 ? (
              <div className="mb-6">
                <img src={turf.images[0].image_key} alt={turf.name}
                  className="h-64 w-full rounded-lg object-cover" />
                {turf.images.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {turf.images.slice(1).map((img) => (
                      <img key={img.id} src={img.image_key} alt={turf.name}
                        className="h-20 w-20 rounded object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 flex h-64 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
                No image
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900">{turf.name}</h2>
            <p className="mt-1 text-gray-500">{turf.location_address}</p>
            {turf.avg_rating && (
              <p className="mt-1 text-sm text-yellow-600">⭐ {turf.avg_rating} · {turf.review_count} review(s)</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">{turf.sport}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{turf.size}</span>
              {turf.surface_type && <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{turf.surface_type}</span>}
            </div>

            {turf.description && <p className="mt-4 text-gray-700">{turf.description}</p>}

            <div className="mt-4 text-lg font-semibold text-gray-900">
              ₹{(turf.price_per_hour / 100).toFixed(0)} / hour
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Open {turf.opening_time?.slice(0, 5)} – {turf.closing_time?.slice(0, 5)}
            </p>

            {turf.amenities?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900">Amenities</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {turf.amenities.map((a) => (
                    <span key={a.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{a.name}</span>
                  ))}
                </div>
              </div>
            )}

            {turf.other_amenities && (
              <p className="mt-2 text-sm text-gray-600">Also: {turf.other_amenities}</p>
            )}

            {hasLocation && (
              <div className="mt-6">
                <h3 className="mb-2 font-semibold text-gray-900">Location</h3>
                <MapView position={position} />
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${turf.latitude},${turf.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                  Get Directions
                </a>
              </div>
            )}

            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-gray-900">Reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : (
                <div className="space-y-2">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm text-yellow-600">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</p>
                      {rv.comment && <p className="text-sm text-gray-700">{rv.comment}</p>}
                      <p className="text-xs text-gray-400">{rv.customer_name} · {new Date(rv.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <BookingWidget turf={turf} />
          </div>
        )}
      </div>
    </div>
  );
}

export default TurfDetail;