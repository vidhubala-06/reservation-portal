import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      {/* top-right auth buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {user ? (
          <>
            <span>Hi, {user.name} ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>

      <h1>Reservation Portal</h1>
      <p>Find and book turf slots near you.</p>
    </div>
  );
}

export default Home;