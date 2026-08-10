import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";

function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900">Book your turf in seconds</h2>
        <p className="mt-4 text-lg text-gray-600">Find and reserve football, cricket, and more near you.</p>

        {user ? (
          <Link to="/turfs"
            className="mt-8 inline-block rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700">
            Browse Turfs
          </Link>
        ) : (
          <Link to="/signup"
            className="mt-8 inline-block rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700">
            Get Started
          </Link>
        )}
      </section>
    </div>
  );
}

export default Home;