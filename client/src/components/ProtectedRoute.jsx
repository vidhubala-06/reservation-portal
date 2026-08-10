import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Guards a route: requires login, and optionally a specific role
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;                       // not logged in
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;                                     // wrong role

  return children;
}

export default ProtectedRoute;