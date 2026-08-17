import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import TurfCard from "../components/TurfCard.jsx";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [size, setSize] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sort, setSort] = useState("");
  const [userLoc, setUserLoc] = useState(null);
  const [locError, setLocError] = useState("");

  const [sports, setSports] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [turfsRes, sportsRes, amenRes] = await Promise.all([
          axios.get("/turfs"),
          axios.get("/meta/sports"),
          axios.get("/meta/amenities"),
        ]);
        setTurfs(turfsRes.data.turfs);
        setSports(sportsRes.data.sports);
        setAmenitiesList(amenRes.data.amenities);
      } catch {
        setError("Failed to load turfs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const findNearMe = () => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => setLocError("Could not get your location")
    );
  };

  const toggleAmenity = (name) =>
    setSelectedAmenities((prev) => (prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]));

  const clearFilters = () => {
    setSearch(""); setSport(""); setSize(""); setMinPrice(""); setMaxPrice("");
    setMinRating(""); setSelectedAmenities([]); setSort(""); setUserLoc(null);
  };

  const displayed = useMemo(() => {
    let list = turfs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.location_address?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q) || t.sport?.toLowerCase().includes(q));
    }
    if (sport) list = list.filter((t) => t.sport === sport);
    if (size) list = list.filter((t) => t.size === size);
    if (minPrice) list = list.filter((t) => t.price_per_hour / 100 >= Number(minPrice));
    if (maxPrice) list = list.filter((t) => t.price_per_hour / 100 <= Number(maxPrice));
    if (minRating) list = list.filter((t) => (t.avg_rating || 0) >= Number(minRating));
    if (selectedAmenities.length > 0) {
      list = list.filter((t) => {
        const has = (t.amenities || "").split(",").map((s) => s.trim());
        return selectedAmenities.every((a) => has.includes(a));
      });
    }
    if (userLoc) {
      list = list.map((t) => ({
        ...t,
        distance: t.latitude && t.longitude ? haversine(userLoc[0], userLoc[1], parseFloat(t.latitude), parseFloat(t.longitude)) : Infinity,
      }));
    }
    if (sort === "price_asc") list = [...list].sort((a, b) => a.price_per_hour - b.price_per_hour);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.price_per_hour - a.price_per_hour);
    else if (sort === "rating") list = [...list].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (userLoc) list = [...list].sort((a, b) => a.distance - b.distance);
    return list;
  }, [turfs, search, sport, size, minPrice, maxPrice, minRating, selectedAmenities, userLoc, sort]);

  const input = "rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Available Turfs</h2>

        <div className="mb-6 space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search location or name" className={`${input} min-w-[180px] flex-1`} />
            <select value={sport} onChange={(e) => setSport(e.target.value)} className={input}>
              <option value="">All sports</option>
              {sports.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={size} onChange={(e) => setSize(e.target.value)} className={input}>
              <option value="">Any size</option>
              <option value="1v1">1v1</option>
              <option value="2v2">2v2</option>
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
            </select>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min ₹" className={`${input} w-24`} />
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max ₹" className={`${input} w-24`} />
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className={input}>
              <option value="">Any rating</option>
              <option value="3">3★+</option>
              <option value="4">4★+</option>
              <option value="4.5">4.5★+</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={input}>
              <option value="">Sort</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Rating</option>
            </select>
            <button onClick={findNearMe} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">📍 Near me</button>
            <button onClick={clearFilters} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">Clear</button>
          </div>

          {amenitiesList.length > 0 && (
            <div className="flex flex-wrap gap-3 border-t pt-3">
              {amenitiesList.map((a) => (
                <label key={a.id} className="flex items-center gap-1 text-sm text-gray-700">
                  <input type="checkbox" checked={selectedAmenities.includes(a.name)} onChange={() => toggleAmenity(a.name)} />
                  {a.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {locError && <p className="mb-2 text-sm text-red-600">{locError}</p>}
        {userLoc && <p className="mb-2 text-sm text-gray-500">Sorted by distance from you.</p>}

        {loading && <p className="text-gray-500">Loading turfs...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && displayed.length === 0 && <p className="text-gray-500">No turfs match your filters.</p>}

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