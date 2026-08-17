import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function ManageStaff() {
    const [turfs, setTurfs] = useState([]);
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState({ turfId: "", name: "", email: "", password: "" });
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const load = async () => {
        try {
            const [t, s] = await Promise.all([axios.get("/owner/turfs"), axios.get("/owner/staff")]);
            setTurfs(t.data.turfs);
            setStaff(s.data.staff);
        } catch {
            /* ignore */
        }
    };
    useEffect(() => { load(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const addStaff = async (e) => {
        e.preventDefault();
        setMsg(""); setErr("");
        try {
            await axios.post("/owner/staff", form);
            setMsg("Staff account created — share these credentials with your incharge.");
            setForm({ turfId: "", name: "", email: "", password: "" });
            load();
        } catch (e2) {
            setErr(e2.response?.data?.message || "Failed to create staff");
        }
    };

    const revoke = async (id) => {
        if (!window.confirm("Revoke this incharge? Their login will stop working.")) return;
        try {
            await axios.delete(`/owner/staff/${id}`);
            load();
        } catch (e2) {
            alert(e2.response?.data?.message || "Failed");
        }
    };

    const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="mx-auto max-w-2xl px-6 py-10">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Manage Incharge / Staff</h2>

                <form onSubmit={addStaff} className="mb-8 space-y-3 rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800">Add incharge</h3>
                    {err && <p className="text-sm text-red-600">{err}</p>}
                    {msg && <p className="text-sm text-green-700">{msg}</p>}
                    <select name="turfId" value={form.turfId} onChange={handleChange} required className={input}>
                        <option value="">Select turf</option>
                        {turfs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Incharge name" required className={input} />
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Login email" required className={input} />
                    <input name="password" value={form.password} onChange={handleChange} placeholder="Set a password" required className={input} />
                    <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                        Create staff account
                    </button>
                </form>

                <h3 className="mb-2 font-semibold text-gray-800">Current staff</h3>
                {staff.length === 0 ? (
                    <p className="text-sm text-gray-500">No staff added.</p>
                ) : (
                    <div className="space-y-3">
                        {staff.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                                <div>
                                    <p className="font-medium text-gray-900">{s.name}</p>
                                    <p className="text-sm text-gray-500">{s.email} · {s.turf_name}</p>
                                </div>
                                <button onClick={() => revoke(s.id)} className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                                    Revoke
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageStaff;