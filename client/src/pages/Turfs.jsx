import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import TurfCard from "../components/TurfCard.jsx";

function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/turfs");
        setTurfs(res.data.turfs);
      } catch {
        setError("Failed to load turfs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Available Turfs</h2>
        {loading && <p className="text-gray-500">Loading turfs...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && turfs.length === 0 && <p className="text-gray-500">No turfs available yet.</p>}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => <TurfCard key={turf.id} turf={turf} />)}
        </div>
      </div>
    </div>
  );
}

export default Turfs;