import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/notifications");
        setNotes(res.data.notifications);
        await axios.patch("/notifications/read"); // mark all read on view
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Notifications</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && notes.length === 0 && <p className="text-gray-500">No notifications yet.</p>}

        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className={`rounded-xl p-4 shadow-sm ${n.is_read ? "bg-white" : "bg-green-50"}`}>
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;