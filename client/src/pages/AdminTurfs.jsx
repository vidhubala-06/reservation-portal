import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function AdminTurfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    try {
      const res = await axios.get("/admin/turfs");
      setTurfs(res.data.turfs);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!reason.trim()) { alert("Please enter a reason"); return; }
    try {
      const res = await axios.patch(`/admin/turfs/${id}/remove`, { reason });
      alert(res.data.message);
      setRemovingId(null); setReason("");
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">All Turfs</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && turfs.length === 0 && <p className="text-gray-500">No turfs.</p>}

        <div className="space-y-3">
          {turfs.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  <p className="text-sm text-gray-500">{t.sport} · {t.location_address}</p>
                  <p className="text-xs text-gray-400">Owner: {t.owner_name} ({t.owner_email})</p>
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t.status}</span>
                </div>
                {t.status !== "taken_down" && (
                  <button onClick={() => { setRemovingId(removingId === t.id ? null : t.id); setReason(""); }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                    Remove
                  </button>
                )}
              </div>

              {removingId === t.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="2"
                    placeholder="Reason for removal (emailed to the owner)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => remove(t.id)}
                      className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                      Confirm removal
                    </button>
                    <button onClick={() => setRemovingId(null)}
                      className="rounded-lg bg-gray-200 px-4 py-1.5 text-sm text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminTurfs;