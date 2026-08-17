import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function AdminDashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/admin/applications");
        setApps(res.data.applications);
      } catch {
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Pending Turf Applications</h2>
          <Link to="/admin/disputes" className="text-sm font-medium text-green-600 hover:underline">
            View open disputes →
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && apps.length === 0 && <p className="text-gray-500">No pending applications.</p>}

        <div className="space-y-3">
          {apps.map((a) => (
            <Link key={a.id} to={`/admin/applications/${a.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.turf_name}</h3>
                  <p className="text-sm text-gray-500">{a.sport} · {a.location_address}</p>
                  <p className="text-xs text-gray-400">By {a.applicant_name} ({a.applicant_email})</p>
                </div>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  {a.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;