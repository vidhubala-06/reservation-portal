import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = search ? `?search=${encodeURIComponent(search)}` : "";
        const res = await axios.get(`/admin/owners${q}`);
        setOwners(res.data.owners);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Owners</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email"
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2" />

        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && owners.length === 0 && <p className="text-gray-500">No owners found.</p>}

        <div className="space-y-3">
          {owners.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <h3 className="font-semibold text-gray-900">{o.name}</h3>
                <p className="text-sm text-gray-500">{o.email} · {o.phone || "—"}</p>
                {o.business_name && <p className="text-xs text-gray-400">{o.business_name}</p>}
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {o.turf_count} turf(s)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminOwners;
