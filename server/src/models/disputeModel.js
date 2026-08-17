import pool from "../config/db.js";

export const createDispute = async (bookingId, customerId, type, description) => {
  const [[booking]] = await pool.query("SELECT id FROM bookings WHERE id=? AND customer_id=?", [bookingId, customerId]);
  if (!booking) return { error: "not_found" };
  const [open] = await pool.query("SELECT id FROM disputes WHERE booking_id=? AND status='open'", [bookingId]);
  if (open.length > 0) return { error: "already_open" };
  const [r] = await pool.query(
    "INSERT INTO disputes (booking_id, type, description, status) VALUES (?, ?, ?, 'open')",
    [bookingId, type, description || null]
  );
  return { disputeId: r.insertId };
};

export const getOpenDisputes = async () => {
  const [rows] = await pool.query(
    `SELECT d.id, d.type, d.description, d.created_at,
            b.id AS booking_id, b.total_amount, b.booking_date, b.start_time,
            t.name AS turf_name, u.name AS customer_name, u.email AS customer_email
     FROM disputes d
     JOIN bookings b ON d.booking_id = b.id
     JOIN turfs t ON b.turf_id = t.id
     JOIN users u ON b.customer_id = u.id
     WHERE d.status = 'open'
     ORDER BY d.created_at ASC`
  );
  return rows;
};

export const getDisputeBookingInfo = async (disputeId) => {
  const [[row]] = await pool.query(
    `SELECT d.status AS dispute_status,
            b.id AS booking_id, b.turf_id, b.status AS booking_status,
            p.id AS payment_id, p.gateway_payment_id, p.total_amount
     FROM disputes d
     JOIN bookings b ON d.booking_id = b.id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE d.id = ?`,
    [disputeId]
  );
  return row || null;
};

export const markDisputeResolved = async (disputeId, status) => {
  await pool.query("UPDATE disputes SET status=?, resolved_at=NOW() WHERE id=?", [status, disputeId]);
};

export const strikeTurf = async (turfId) => {
  await pool.query("UPDATE turfs SET strike_count = strike_count + 1 WHERE id = ?", [turfId]);
};