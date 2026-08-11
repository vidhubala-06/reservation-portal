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

// List applications awaiting review
export const getPendingApplications = async () => {
  const [rows] = await pool.query(
    `SELECT ta.id, ta.turf_name, ta.applicant_name, ta.applicant_email,
            ta.location_address, ta.status, ta.created_at,
            COALESCE(sc.name, ta.custom_sport) AS sport
     FROM turf_applications ta
     LEFT JOIN sport_categories sc ON ta.sport_category_id = sc.id
     WHERE ta.status IN ('pending','needs_correction')
     ORDER BY ta.created_at ASC`
  );
  return rows;
};

// Handles both cases: already-parsed (JSON column) or a string
const parseJson = (val, fallback = []) => {
  if (val == null) return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val; // mysql2 already parsed the JSON column
};

export const getApplicationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ta.*, COALESCE(sc.name, ta.custom_sport) AS sport
     FROM turf_applications ta
     LEFT JOIN sport_categories sc ON ta.sport_category_id = sc.id
     WHERE ta.id = ?`,
    [id]
  );
  const app = rows[0];
  if (!app) return null;

  app.photos = parseJson(app.photos, []);
  app.amenities = parseJson(app.amenities, []);

  if (app.amenities.length > 0) {
    const [amenRows] = await pool.query("SELECT name FROM amenities WHERE id IN (?)", [app.amenities]);
    app.amenityNames = amenRows.map((a) => a.name);
  } else {
    app.amenityNames = [];
  }
  return app;
};