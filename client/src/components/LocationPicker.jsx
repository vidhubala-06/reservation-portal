import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default marker icons (bundler issue)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

function LocationPicker({ position, setPosition }) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
      );
      const results = await res.json();
      if (results.length > 0) {
        setPosition([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
      }
    } catch {
      /* ignore */
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search location (e.g. Anna Nagar, Chennai)"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button type="button" onClick={handleSearch}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          {searching ? "..." : "Search"}
        </button>
      </div>

      <MapContainer center={position} zoom={13} style={{ height: "300px", borderRadius: "0.5rem" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          draggable
          eventHandlers={{
            dragend(e) {
              const m = e.target.getLatLng();
              setPosition([m.lat, m.lng]);
            },
          }}
        />
        <ClickHandler setPosition={setPosition} />
        <Recenter position={position} />
      </MapContainer>

      <p className="mt-1 text-xs text-gray-500">
        Search, click the map, or drag the pin. Selected: {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </p>
    </div>
  );
}

export default LocationPicker;