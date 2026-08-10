import Navbar from "../components/Navbar.jsx";

function Turfs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900">Available Turfs</h2>
        <p className="mt-2 text-gray-600">Turf listings will appear here.</p>
      </div>
    </div>
  );
}

export default Turfs;