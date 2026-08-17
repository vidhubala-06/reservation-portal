import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function AdminFlaggedTurfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await axios.get("/admin/flagged-turfs");
      setTurfs(res.data.turfs);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const action = async (id, type) => {
    if (!window.confirm(`${type === "suspend" ? "Suspend" : "Reinstate"} this turf?`)) return;
    try {
      const res = await axios.patch(`/admin/turfs/${id}/${type}`);
      alert(res.data.message);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Reported Turfs</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && turfs.length === 0 && <p className="text-gray-500">No reported turfs.</p>}

        <div className="space-y-3">
          {turfs.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.location_address}</p>
                <p className="text-xs text-gray-400">Owner: {t.owner_name} ({t.owner_email})</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">{t.report_count} report(s)</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{t.strike_count} strike(s)</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t.status}</span>
                </div>
              </div>
              {t.status === "taken_down" ? (
                <button onClick={() => action(t.id, "reinstate")}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Reinstate
                </button>
              ) : (
                <button onClick={() => action(t.id, "suspend")}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                  Suspend
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminFlaggedTurfs;