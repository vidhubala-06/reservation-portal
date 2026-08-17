import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await axios.get("/admin/disputes");
      setDisputes(res.data.disputes);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id, action) => {
    const msg = action === "refund"
      ? "Refund the customer fully and strike the turf?"
      : "Deny this dispute?";
    if (!window.confirm(msg)) return;
    try {
      const res = await axios.post(`/admin/disputes/${id}/resolve`, { action });
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
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Open Disputes</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && disputes.length === 0 && <p className="text-gray-500">No open disputes.</p>}

        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{d.turf_name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(d.booking_date).toLocaleDateString()} · {d.start_time?.slice(0,5)} · ₹{(d.total_amount/100).toFixed(0)}
                  </p>
                  <p className="mt-1 text-sm"><span className="text-gray-500">Issue:</span> {d.type.replace(/_/g," ")}</p>
                  {d.description && <p className="text-sm text-gray-600">"{d.description}"</p>}
                  <p className="text-xs text-gray-400">By {d.customer_name} ({d.customer_email})</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => resolve(d.id, "refund")} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700">Refund & Strike</button>
                  <button onClick={() => resolve(d.id, "deny")} className="rounded-lg bg-gray-200 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-300">Deny</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDisputes;