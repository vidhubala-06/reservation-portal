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

// Ownership check reused by slot actions
export const ownsTurf = async (turfId, userId) => {
  const [rows] = await pool.query(
    `SELECT t.id FROM turfs t
     JOIN owner_profiles op ON t.owner_id = op.id
     WHERE t.id = ? AND op.user_id = ?`,
    [turfId, userId]
  );
  return rows.length > 0;
};

export const blockSlot = async (turfId, userId, date, slotTime) => {
  if (!(await ownsTurf(turfId, userId))) return { error: "not_found" };

  try {
    await pool.query(
      "INSERT INTO slot_reservations (turf_id, slot_date, slot_time, type) VALUES (?, ?, ?, 'blocked')",
      [turfId, date, slotTime]
    );
    return { ok: true };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      // slot already occupied — is it booked or already blocked?
      const [rows] = await pool.query(
        "SELECT type FROM slot_reservations WHERE turf_id = ? AND slot_date = ? AND slot_time = ?",
        [turfId, date, slotTime]
      );
      if (rows[0]?.type === "booked") return { error: "already_booked" };
      return { ok: true }; // already blocked → idempotent success
    }
    throw err;
  }
};

export const unblockSlot = async (turfId, userId, date, slotTime) => {
  if (!(await ownsTurf(turfId, userId))) return { error: "not_found" };
  await pool.query(
    "DELETE FROM slot_reservations WHERE turf_id = ? AND slot_date = ? AND slot_time = ? AND type = 'blocked'",
    [turfId, date, slotTime]
  );
  return { ok: true };
};

// All bookings across this owner's turfs (optionally filtered by date)
export const getOwnerBookings = async (userId, date) => {
  let sql = `
    SELECT b.id, b.booking_date, b.start_time, b.end_time, b.duration_hours,
           b.total_amount, b.status,
           t.name AS turf_name,
           u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
    FROM bookings b
    JOIN turfs t ON b.turf_id = t.id
    JOIN owner_profiles op ON t.owner_id = op.id
    JOIN users u ON b.customer_id = u.id
    WHERE op.user_id = ?`;
  const params = [userId];
  if (date) { sql += " AND b.booking_date = ?"; params.push(date); }
  sql += " ORDER BY b.booking_date DESC, b.start_time ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
};

export const getOwnerEarnings = async (userId) => {
  const [[profile]] = await pool.query(
    "SELECT id, balance FROM owner_profiles WHERE user_id = ?",
    [userId]
  );
  if (!profile) return { balance: 0, transactions: [] };
  const [transactions] = await pool.query(
    "SELECT id, amount, type, reason, created_at FROM owner_balance_transactions WHERE owner_id = ? ORDER BY id DESC",
    [profile.id]
  );
  return { balance: profile.balance, transactions };
};

// Confirmed bookings for a turf on a date (with payment details), for a rain closure
export const cancelDayBookings = async (turfId, userId, date) => {
  if (!(await ownsTurf(turfId, userId))) return { error: "not_found" };
  const [bookings] = await pool.query(
    `SELECT b.id, p.id AS payment_id, p.gateway_payment_id,
            p.total_amount, p.owner_share, p.commission
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.turf_id = ? AND b.booking_date = ? AND b.status = 'confirmed'`,
    [turfId, date]
  );
  return { bookings };
};