import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import TurfCard from "../components/TurfCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Home() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/turfs");
        setTurfs(res.data.turfs);
      } catch {
        // silently ignore on home
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900">Book your turf in seconds</h2>
        <p className="mt-4 text-lg text-gray-600">Find and reserve football, cricket, and more near you.</p>
        {!user && (
          <Link to="/signup"
            className="mt-8 inline-block rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700">
            Get Started
          </Link>
        )}
      </section>

      {/* Turf listings */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h3 className="mb-6 text-2xl font-bold text-gray-900">Available Turfs</h3>
        {loading && <p className="text-gray-500">Loading turfs...</p>}
        {!loading && turfs.length === 0 && <p className="text-gray-500">No turfs available yet.</p>}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {turfs.map((turf) => <TurfCard key={turf.id} turf={turf} />)}
        </div>
      </section>
    </div>
  );
}

export default Home;