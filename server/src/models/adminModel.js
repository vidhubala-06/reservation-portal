import pool from "../config/db.js";

export const getFlaggedTurfs = async () => {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.status, t.strike_count, t.location_address,
            u.name AS owner_name, u.email AS owner_email,
            COUNT(d.id) AS report_count
     FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     JOIN users u ON op.user_id = u.id
     JOIN bookings b ON b.turf_id = t.id
     JOIN disputes d ON d.booking_id = b.id
     GROUP BY t.id, t.name, t.status, t.strike_count, t.location_address, u.name, u.email
     ORDER BY report_count DESC`
  );
  return rows;
};

export const setTurfStatus = async (turfId, status) => {
  await pool.query("UPDATE turfs SET status = ? WHERE id = ?", [status, turfId]);
};

export const getOwners = async (search) => {
  let sql = `
    SELECT u.id, u.name, u.email, u.phone,
           op.business_name,
           (SELECT COUNT(*) FROM turfs t WHERE t.owner_id = op.id) AS turf_count
    FROM users u
    JOIN owner_profiles op ON op.user_id = u.id
    WHERE u.role = 'owner'`;
  const params = [];
  if (search) {
    sql += " AND (u.name LIKE ? OR u.email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY u.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

export const getAllTurfs = async () => {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.status, t.location_address, t.strike_count,
            sc.name AS sport,
            u.name AS owner_name, u.email AS owner_email
     FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     JOIN users u ON op.user_id = u.id
     LEFT JOIN sport_categories sc ON t.sport_category_id = sc.id
     ORDER BY t.created_at DESC`
  );
  return rows;
};

export const getTurfOwnerInfo = async (turfId) => {
  const [[row]] = await pool.query(
    `SELECT t.name AS turf_name, u.name AS owner_name, u.email AS owner_email
     FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     JOIN users u ON op.user_id = u.id
     WHERE t.id = ?`,
    [turfId]
  );
  return row || null;
};