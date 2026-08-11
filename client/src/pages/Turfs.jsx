import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import TurfCard from "../components/TurfCard.jsx";

// distance in km between two lat/long points
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [userLoc, setUserLoc] = useState(null);
  const [locError, setLocError] = useState("");

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

  const findNearMe = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => setLocError("Could not get your location")
    );
  };

  const displayed = useMemo(() => {
    let list = turfs;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.location_address?.toLowerCase().includes(q) ||
          t.name?.toLowerCase().includes(q) ||
          t.sport?.toLowerCase().includes(q)
      );
    }

    if (userLoc) {
      list = list
        .map((t) => ({
          ...t,
          distance:
            t.latitude && t.longitude
              ? haversine(userLoc[0], userLoc[1], parseFloat(t.latitude), parseFloat(t.longitude))
              : Infinity,
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return list;
  }, [turfs, search, userLoc]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Available Turfs</h2>

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location, name, or sport"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={findNearMe}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
            📍 Turfs near me
          </button>
        </div>
        {locError && <p className="mb-4 text-sm text-red-600">{locError}</p>}
        {userLoc && <p className="mb-4 text-sm text-gray-500">Sorted by distance from you.</p>}

        {loading && <p className="text-gray-500">Loading turfs...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <p className="text-gray-500">No turfs found. Try a different search.</p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((turf) => (
            <div key={turf.id}>
              <TurfCard turf={turf} />
              {turf.distance !== undefined && turf.distance !== Infinity && (
                <p className="mt-1 text-xs text-gray-500">{turf.distance.toFixed(1)} km away</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Turfs;