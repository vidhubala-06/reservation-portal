import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-green-600">Reservation Portal</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                Hi, {user.name} <span className="text-gray-400">({user.role})</span>
              </span>
              <button onClick={logout}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-green-600">Login</Link>
              <Link to="/signup"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900">Book your turf in seconds</h2>
        <p className="mt-4 text-lg text-gray-600">Find and reserve football, cricket, and more near you.</p>
        <Link to="/signup"
          className="mt-8 inline-block rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700">
          Get Started
        </Link>
      </section>
    </div>
  );
}

export default Home;