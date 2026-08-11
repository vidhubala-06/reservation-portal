import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Turfs from "./pages/Turfs.jsx";
import TurfDetail from "./pages/TurfDetail.jsx";
import PostTurf from "./pages/PostTurf.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route path="/owner" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/turfs" element={<Turfs />} />
      <Route path="/turfs/:id" element={<TurfDetail />} />
      <Route path="/post-turf" element={
        <ProtectedRoute>
        <PostTurf />
      </ProtectedRoute>
     } />
    </Routes>
  );
}

export default App;