import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function OwnerDashboard() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/owner/turfs");
        setTurfs(res.data.turfs);
      } catch {
        setError("Failed to load your turfs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Turfs</h2>
          <div className="flex gap-3">
            <Link to="/owner/bookings"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              View Bookings
            </Link>
            <Link to="/owner/earnings"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Earnings
            </Link>
            <Link to="/post-turf"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              + Add turf
            </Link>
          </div>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && turfs.length === 0 && <p className="text-gray-500">You have no turfs yet.</p>}

        <div className="space-y-3">
          {turfs.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              {/* clickable info → public turf page */}
              <Link to={`/turfs/${t.id}`} className="flex flex-1 items-center gap-4 hover:opacity-80">
                {t.primary_image
                  ? <img src={t.primary_image} alt={t.name} className="h-16 w-16 rounded object-cover" />
                  : <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200 text-xs text-gray-400">No image</div>}
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-sm text-gray-500">{t.sport} · ₹{(t.price_per_hour / 100).toFixed(0)}/hr</p>
                  <span className="text-xs text-gray-400">{t.status}</span>
                </div>
              </Link>

              <div className="ml-4 flex gap-2">
                <Link to={`/owner/turfs/${t.id}/slots`}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                  Slots
                </Link>
                <Link to={`/owner/turfs/${t.id}/edit`}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;