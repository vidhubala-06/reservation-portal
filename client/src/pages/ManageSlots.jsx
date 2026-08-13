import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

const fmt = (h) => `${String(h).padStart(2, "0")}:00`;
const slotStr = (h) => `${String(h).padStart(2, "0")}:00:00`;

function ManageSlots() {
  const { id } = useParams();
  const today = new Date().toISOString().slice(0, 10);
  const [turf, setTurf] = useState(null);
  const [date, setDate] = useState(today);
  const [booked, setBooked] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`/owner/turfs/${id}`);
        setTurf(res.data.turf);
      } catch {
        setErr("Failed to load turf");
      }
    })();
  }, [id]);

  const loadAvailability = async () => {
    try {
      const res = await axios.get(`/bookings/availability?turfId=${id}&date=${date}`);
      setBooked(res.data.booked.map((t) => parseInt(t.slice(0, 2), 10)));
      setBlocked(res.data.blocked.map((t) => parseInt(t.slice(0, 2), 10)));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (turf) loadAvailability();
    setErr("");
  }, [date, turf]);

  const toggle = async (h) => {
    setErr("");
    try {
      const endpoint = blocked.includes(h) ? "unblock" : "block";
      await axios.post(`/owner/turfs/${id}/${endpoint}`, { date, slotTime: slotStr(h) });
      loadAvailability();
    } catch (e) {
      setErr(e.response?.data?.message || "Action failed");
    }
  };

  if (!turf) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <p className="text-gray-500">Loading...</p>
          {err && <p className="text-red-600">{err}</p>}
        </div>
      </div>
    );
  }

  const openHour = parseInt(turf.opening_time.slice(0, 2), 10);
  const closeHour = parseInt(turf.closing_time.slice(0, 2), 10);
  const slots = [];
  for (let h = openHour; h < closeHour; h++) slots.push(h);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Manage Slots — {turf.name}</h2>
        <p className="mb-4 text-sm text-gray-600">
          Click a free slot to block it for maintenance. Click a blocked slot to unblock. Booked slots can't be changed.
        </p>

        <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
          className="mb-4 rounded-lg border border-gray-300 px-3 py-2" />

        {err && <p className="mb-2 text-sm text-red-600">{err}</p>}

        <div className="flex flex-wrap gap-2">
          {slots.map((h) => {
            const isBooked = booked.includes(h);
            const isBlocked = blocked.includes(h);
            return (
              <button key={h} type="button" disabled={isBooked} onClick={() => toggle(h)}
                className={`rounded px-3 py-2 text-sm ${
                  isBooked
                    ? "cursor-not-allowed bg-blue-100 text-blue-500"
                    : isBlocked
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {fmt(h)}{isBooked ? " (booked)" : isBlocked ? " (blocked)" : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ManageSlots;