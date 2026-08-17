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
import ApplicationReview from "./pages/ApplicationReview.jsx";
import EditTurf from "./pages/EditTurf.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import ManageSlots from "./pages/ManageSlots.jsx";
import OwnerBookings from "./pages/OwnerBookings.jsx";
import OwnerEarnings from "./pages/OwnerEarnings.jsx";
import AdminDisputes from "./pages/AdminDisputes.jsx";

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
      <Route path="/my-bookings" element={
        <ProtectedRoute>
          <MyBookings />
        </ProtectedRoute>
      } />
      <Route path="/post-turf" element={
        <ProtectedRoute>
        <PostTurf />
      </ProtectedRoute>
     } />
      <Route path="/admin/applications/:id" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <ApplicationReview />
        </ProtectedRoute>
      } />
      <Route path="/owner/turfs/:id/edit" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <EditTurf />
        </ProtectedRoute>
      } />
      <Route path="/owner/turfs/:id/slots" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <ManageSlots />
        </ProtectedRoute>
      } />
      <Route path="/owner/bookings" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerBookings />
        </ProtectedRoute>
      } />
      <Route path="/owner/earnings" element={
        <ProtectedRoute allowedRoles={["owner"]}>
          <OwnerEarnings />
        </ProtectedRoute>
      } />
      <Route path="/admin/disputes" element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDisputes />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;