import pool from "../config/db.js";

// Public list: only approved turfs, with sport name + primary image (if any)
export const getApprovedTurfs = async () => {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.location_address, t.price_per_hour, t.size, t.surface_type,
            sc.name AS sport,
            (SELECT image_key FROM turf_images
             WHERE turf_id = t.id AND is_primary = TRUE LIMIT 1) AS primary_image
     FROM turfs t
     LEFT JOIN sport_categories sc ON t.sport_category_id = sc.id
     WHERE t.status = 'approved'
     ORDER BY t.created_at DESC`
  );
  return rows;
};

// Single approved turf, with its images and amenities
export const getTurfById = async (id) => {
  const [turfRows] = await pool.query(
    `SELECT t.*, sc.name AS sport
     FROM turfs t
     LEFT JOIN sport_categories sc ON t.sport_category_id = sc.id
     WHERE t.id = ? AND t.status = 'approved'`,
    [id]
  );
  const turf = turfRows[0];
  if (!turf) return null;

  const [images] = await pool.query(
    "SELECT id, image_key, is_primary FROM turf_images WHERE turf_id = ?",
    [id]
  );
  const [amenities] = await pool.query(
    `SELECT a.id, a.name FROM turf_amenities ta
     JOIN amenities a ON ta.amenity_id = a.id
     WHERE ta.turf_id = ?`,
    [id]
  );

  turf.images = images;
  turf.amenities = amenities;
  return turf;
};