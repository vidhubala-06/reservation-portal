import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import LocationPicker from "../components/LocationPicker.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  pan_number: "", business_name: "", business_address: "",
  turf_name: "", sport_category_id: "", size: "7v7", surface_type: "",
  location_address: "", price_per_hour: "", opening_time: "06:00", closing_time: "23:00",
};

const DRAFT_KEY = "postTurfDraftV2";

const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {};
  } catch {
    return {};
  }
};

function PostTurf() {
  const { user } = useAuth();

  const [form, setForm] = useState(() => loadDraft().form || emptyForm);
  const [customSport, setCustomSport] = useState(() => loadDraft().customSport || "");
  const [otherAmenities, setOtherAmenities] = useState(() => loadDraft().otherAmenities || "");
  const [selectedAmenities, setSelectedAmenities] = useState(() => loadDraft().selectedAmenities || []);
  const [position, setPosition] = useState(() => loadDraft().position || [13.0827, 80.2707]);

  const [sports, setSports] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [sportsRes, amenRes] = await Promise.all([
          axios.get("/meta/sports"),
          axios.get("/meta/amenities"),
        ]);
        setSports(sportsRes.data.sports);
        setAmenitiesList(amenRes.data.amenities);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ form, customSport, otherAmenities, selectedAmenities, position })
    );
  }, [form, customSport, otherAmenities, selectedAmenities, position]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleAmenity = (id) =>
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  const handlePhotoAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setPhotos((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const data = new FormData();
      Object.keys(form).forEach((key) => {
        if (key === "sport_category_id") return;
        data.append(key, form[key]);
      });
      if (form.sport_category_id === "other") data.append("custom_sport", customSport);
      else data.append("sport_category_id", form.sport_category_id);

      data.append("latitude", position[0]);
      data.append("longitude", position[1]);
      data.append("other_amenities", otherAmenities);
      data.append("amenities", JSON.stringify(selectedAmenities));
      photos.forEach((f) => data.append("photos", f));

      await axios.post("/applications", data);
      setSuccess("Your application has been submitted for review. We'll email you once it's approved.");

      setForm(emptyForm);
      setCustomSport("");
      setOtherAmenities("");
      setSelectedAmenities([]);
      setPhotos([]);
      setPosition([13.0827, 80.2707]);
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    }
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">List your turf</h2>
        <p className="mb-6 text-gray-600">
          Applying as <strong>{user?.name}</strong> ({user?.email}). Fill in the details below —
          our team will review and approve your turf.
        </p>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-semibold text-gray-800">Owner details</h3>
          <input name="pan_number" placeholder="PAN number" value={form.pan_number} onChange={handleChange} className={input} />
          <input name="business_name" placeholder="Business name (optional)" value={form.business_name} onChange={handleChange} className={input} />
          <input name="business_address" placeholder="Business address (optional)" value={form.business_address} onChange={handleChange} className={input} />

          <h3 className="pt-2 font-semibold text-gray-800">Turf details</h3>
          <input name="turf_name" placeholder="Turf name" value={form.turf_name} onChange={handleChange} required className={input} />

          <select name="sport_category_id" value={form.sport_category_id} onChange={handleChange} required className={input}>
            <option value="">Select sport</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="other">Other (specify)</option>
          </select>
          {form.sport_category_id === "other" && (
            <input value={customSport} onChange={(e) => setCustomSport(e.target.value)}
              placeholder="Enter the sport name" required className={input} />
          )}

          <select name="size" value={form.size} onChange={handleChange} className={input}>
            <option value="1v1">1v1 (2 players)</option>
            <option value="2v2">2v2 (4 players)</option>
            <option value="5v5">5v5</option>
            <option value="7v7">7v7</option>
            <option value="11v11">11v11</option>
          </select>
          <input name="surface_type" placeholder="Surface type (e.g. Artificial Grass)" value={form.surface_type} onChange={handleChange} className={input} />
          <input name="location_address" placeholder="Address (text)" value={form.location_address} onChange={handleChange} required className={input} />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Pin the exact location</label>
            <LocationPicker position={position} setPosition={setPosition} />
          </div>

          <input name="price_per_hour" type="number" min="0" placeholder="Price per hour (₹)" value={form.price_per_hour} onChange={handleChange} required className={input} />

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-600">Opening time</label>
              <input name="opening_time" type="time" value={form.opening_time} onChange={handleChange} className={input} />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600">Closing time</label>
              <input name="closing_time" type="time" value={form.closing_time} onChange={handleChange} className={input} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {amenitiesList.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={selectedAmenities.includes(a.id)} onChange={() => toggleAmenity(a.id)} />
                  {a.name}
                </label>
              ))}
            </div>
            <input value={otherAmenities} onChange={(e) => setOtherAmenities(e.target.value)}
              placeholder="Other amenities (comma separated, e.g. CCTV, Cafeteria)"
              className={`${input} mt-2`} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Turf photos</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="w-full text-sm text-gray-600" />
            {photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((file, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(file)} alt="" className="h-20 w-20 rounded object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700">
            Submit for review
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostTurf;