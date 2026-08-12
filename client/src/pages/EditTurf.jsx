import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function EditTurf() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/owner/turfs/${id}`);
        const t = res.data.turf;
        setForm({
          name: t.name || "",
          description: t.description || "",
          price_per_hour: (t.price_per_hour / 100).toString(),
          size: t.size || "5v5",
          surface_type: t.surface_type || "",
          opening_time: t.opening_time?.slice(0, 5) || "06:00",
          closing_time: t.closing_time?.slice(0, 5) || "23:00",
          other_amenities: t.other_amenities || "",
        });
      } catch (err) {
        setError(err.response?.status === 404 ? "Turf not found" : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setError("");
    try {
      await axios.patch(`/owner/turfs/${id}`, form);
      setMsg("Turf updated");
      setTimeout(() => navigate("/owner"), 800);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Edit Turf</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}
        {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{msg}</p>}

        {form && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Turf name" required className={input} />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="3" className={input} />
            <select name="size" value={form.size} onChange={handleChange} className={input}>
              <option value="1v1">1v1</option>
              <option value="2v2">2v2</option>
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
            </select>
            <input name="surface_type" value={form.surface_type} onChange={handleChange} placeholder="Surface type" className={input} />
            <input name="price_per_hour" type="number" min="0" value={form.price_per_hour} onChange={handleChange} placeholder="Price per hour (₹)" required className={input} />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-600">Opening</label>
                <input name="opening_time" type="time" value={form.opening_time} onChange={handleChange} className={input} />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-600">Closing</label>
                <input name="closing_time" type="time" value={form.closing_time} onChange={handleChange} className={input} />
              </div>
            </div>
            <input name="other_amenities" value={form.other_amenities} onChange={handleChange} placeholder="Other amenities" className={input} />
            <button type="submit" disabled={busy}
              className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {busy ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditTurf;