import pool from "../config/db.js";

export const recordPayment = async ({ bookingId, totalAmount, commission, ownerShare, gatewayPaymentId }) => {
  await pool.query(
    `INSERT INTO payments (booking_id, total_amount, commission, owner_share, gateway_payment_id, status)
     VALUES (?, ?, ?, ?, ?, 'succeeded')`,
    [bookingId, totalAmount, commission, ownerShare, gatewayPaymentId]
  );
};