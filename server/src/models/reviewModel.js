import pool from "../config/db.js";

export const createReview = async (bookingId, customerId, rating, comment) => {
  const [[booking]] = await pool.query(
    "SELECT id, status FROM bookings WHERE id = ? AND customer_id = ?",
    [bookingId, customerId]
  );
  if (!booking) return { error: "not_found" };
  if (booking.status !== "confirmed") return { error: "not_reviewable" };

  const [existing] = await pool.query("SELECT id FROM reviews WHERE booking_id = ?", [bookingId]);
  if (existing.length > 0) return { error: "already_reviewed" };

  await pool.query("INSERT INTO reviews (booking_id, rating, comment) VALUES (?, ?, ?)", [bookingId, rating, comment || null]);
  return { ok: true };
};

export const getReviewsForTurf = async (turfId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS customer_name
     FROM reviews r
     JOIN bookings b ON r.booking_id = b.id
     JOIN users u ON b.customer_id = u.id
     WHERE b.turf_id = ?
     ORDER BY r.id DESC`,
    [turfId]
  );
  return rows;
};