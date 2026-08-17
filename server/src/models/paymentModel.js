import pool from "../config/db.js";

export const recordPayment = async ({ bookingId, totalAmount, commission, ownerShare, gatewayPaymentId }) => {
  const [r] = await pool.query(
    `INSERT INTO payments (booking_id, total_amount, commission, owner_share, gateway_payment_id, status)
     VALUES (?, ?, ?, ?, ?, 'succeeded')`,
    [bookingId, totalAmount, commission, ownerShare, gatewayPaymentId]
  );
  return r.insertId;
};

// Credit the owner's share to their balance ledger
export const recordOwnerEarning = async (bookingId, ownerShare, paymentId, reason) => {
  const [[owner]] = await pool.query(
    `SELECT op.id FROM bookings b
     JOIN turfs t ON b.turf_id = t.id
     JOIN owner_profiles op ON t.owner_id = op.id
     WHERE b.id = ?`,
    [bookingId]
  );
  if (!owner) return;

  await pool.query(
    "INSERT INTO owner_balance_transactions (owner_id, payment_id, amount, type, reason) VALUES (?, ?, ?, 'earning', ?)",
    [owner.id, paymentId, ownerShare, reason]
  );
  await pool.query("UPDATE owner_profiles SET balance = balance + ? WHERE id = ?", [ownerShare, owner.id]);
};