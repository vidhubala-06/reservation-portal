import { Link } from "react-router-dom";

function TurfCard({ turf }) {
  return (
    <Link to={`/turfs/${turf.id}`}
      className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      <div className="flex h-40 items-center justify-center bg-gray-200 text-gray-400">
        {turf.primary_image
          ? <img src={turf.primary_image} alt={turf.name} className="h-full w-full object-cover" />
          : <span>No image</span>}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{turf.name}</h3>
        <p className="text-sm text-gray-500">{turf.location_address}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            {turf.sport} · {turf.size}
          </span>
          <span className="font-semibold text-gray-900">
            ₹{(turf.price_per_hour / 100).toFixed(0)}/hr
          </span>
        </div>
      </div>
    </Link>
  );
}

export default TurfCard;