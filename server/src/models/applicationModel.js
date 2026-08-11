import pool from "../config/db.js";

export const createApplication = async (data) => {
  const {
    existing_user_id,
    applicant_name, applicant_email, applicant_phone, pan_number,
    business_name, business_address,
    turf_name, sport_category_id, custom_sport, size, surface_type,
    location_address, latitude, longitude,
    price_per_hour, opening_time, closing_time,
    amenities, other_amenities, photos,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO turf_applications
       (existing_user_id, applicant_name, applicant_email, applicant_phone, pan_number,
        business_name, business_address,
        turf_name, sport_category_id, custom_sport, size, surface_type,
        location_address, latitude, longitude,
        price_per_hour, opening_time, closing_time,
        amenities, other_amenities, photos, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      existing_user_id || null,
      applicant_name, applicant_email, applicant_phone || null, pan_number || null,
      business_name || null, business_address || null,
      turf_name, sport_category_id || null, custom_sport || null, size, surface_type || null,
      location_address, latitude || null, longitude || null,
      price_per_hour, opening_time, closing_time,
      amenities || null, other_amenities || null, photos || null,
    ]
  );
  return result.insertId;
};