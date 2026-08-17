import pool from "../config/db.js";

export const createNotification = async (userId, message, type = "general") => {
  await pool.query("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)", [userId, message, type]);
};

export const getNotifications = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30",
    [userId]
  );
  return rows;
};

export const markAllRead = async (userId) => {
  await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE", [userId]);
};

// Helper: notify the customer their booking is confirmed
export const notifyBookingConfirmed = async (bookingId) => {
  const [[b]] = await pool.query(
    "SELECT b.customer_id, t.name AS turf_name FROM bookings b JOIN turfs t ON b.turf_id = t.id WHERE b.id = ?",
    [bookingId]
  );
  if (b) await createNotification(b.customer_id, `Booking confirmed for ${b.turf_name}.`, "booking");
};