import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold text-green-600">Reservation Portal</Link>
        <Link to="/turfs" className="text-sm font-medium text-gray-700 hover:text-green-600">Browse Turfs</Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/my-bookings" className="text-sm font-medium text-gray-700 hover:text-green-600">
              My Bookings
            </Link>
            {user.role === "owner" && (
              <Link to="/owner" className="text-sm font-medium text-gray-700 hover:text-green-600">
                Owner Dashboard
              </Link>
            )}
            {user.role === "admin" && (
              <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-green-600">
                Admin Panel
              </Link>
            )}
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
  );
}

export default Navbar;