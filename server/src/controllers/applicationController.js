import { createApplication } from "../models/applicationModel.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

export const submitApplication = async (req, res) => {
  try {
    const {
      pan_number, business_name, business_address,
      turf_name, sport_category_id, custom_sport, size, surface_type,
      location_address, latitude, longitude,
      price_per_hour, opening_time, closing_time,
      amenities, other_amenities,
    } = req.body;

    if (!turf_name || (!sport_category_id && !custom_sport) ||
        !location_address || !price_per_hour || !opening_time || !closing_time) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      photoUrls = await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer)));
    }

    let amenityIds = [];
    if (amenities) amenityIds = Array.isArray(amenities) ? amenities : JSON.parse(amenities);

    const applicationId = await createApplication({
      existing_user_id: req.user.id,          // linked to the logged-in user
      applicant_name: req.user.name,          // contact taken from the account
      applicant_email: req.user.email,
      applicant_phone: req.user.phone,
      pan_number,
      business_name, business_address,
      turf_name,
      sport_category_id: sport_category_id || null,
      custom_sport: custom_sport || null,
      size, surface_type,
      location_address,
      latitude: latitude || null,
      longitude: longitude || null,
      price_per_hour: Math.round(Number(price_per_hour) * 100),
      opening_time, closing_time,
      amenities: JSON.stringify(amenityIds),
      other_amenities: other_amenities || null,
      photos: JSON.stringify(photoUrls),
    });

    res.status(201).json({ message: "Application submitted for review", applicationId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};