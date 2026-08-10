import Navbar from "../components/Navbar.jsx";

function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900">Owner Dashboard</h2>
        <p className="mt-2 text-gray-600">Your turfs and bookings will appear here.</p>
      </div>
    </div>
  );
}

export default OwnerDashboard;