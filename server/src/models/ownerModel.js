import pool from "../config/db.js";

// All turfs belonging to this owner (via their user id → owner_profile → turfs)
export const getOwnerTurfs = async (userId) => {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.status, t.price_per_hour,
            sc.name AS sport,
            (SELECT image_key FROM turf_images WHERE turf_id = t.id AND is_primary = TRUE LIMIT 1) AS primary_image
     FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     LEFT JOIN sport_categories sc ON t.sport_category_id = sc.id
     WHERE op.user_id = ?
     ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows;
};

// One turf, only if it belongs to this owner
export const getOwnerTurfById = async (turfId, userId) => {
  const [rows] = await pool.query(
    `SELECT t.* FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     WHERE t.id = ? AND op.user_id = ?`,
    [turfId, userId]
  );
  return rows[0] || null;
};

// Update editable fields, only if the turf belongs to this owner
export const updateOwnerTurf = async (turfId, userId, data) => {
  const [own] = await pool.query(
    `SELECT t.id FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     WHERE t.id = ? AND op.user_id = ?`,
    [turfId, userId]
  );
  if (own.length === 0) return { error: "not_found" };

  const { name, description, price_per_hour, size, surface_type, opening_time, closing_time, other_amenities } = data;
  await pool.query(
    `UPDATE turfs
     SET name=?, description=?, price_per_hour=?, size=?, surface_type=?, opening_time=?, closing_time=?, other_amenities=?
     WHERE id=?`,
    [name, description || null, price_per_hour, size, surface_type || null, opening_time, closing_time, other_amenities || null, turfId]
  );
  return { ok: true };
};