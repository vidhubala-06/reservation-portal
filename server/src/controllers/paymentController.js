import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import pool from "../config/db.js";
import {
  createHeldBooking, confirmBookingPaid, releaseHeldBooking, getBookingForPayment,
} from "../models/bookingModel.js";
import { recordPayment, recordOwnerEarning } from "../models/paymentModel.js";

// POST /api/payments/order — reserve slots + create a Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { turfId, date, startHour, durationHours } = req.body;
    if (!turfId || !date || startHour == null || !durationHours) {
      return res.status(400).json({ message: "Missing booking details" });
    }

    const result = await createHeldBooking({
      turfId, customerId: req.user.id, bookingDate: date,
      startHour: Number(startHour), durationHours: Number(durationHours),
    });
    const errs = {
      turf_unavailable: "Turf is not available",
      outside_hours: "Selected time is outside operating hours",
      slot_taken: "One or more slots are no longer available",
    };
    if (result.error) return res.status(409).json({ message: errs[result.error] || "Booking failed" });

    const order = await razorpay.orders.create({
      amount: result.totalAmount, // in paise
      currency: "INR",
      receipt: `booking_${result.bookingId}`,
    });
    await pool.query("UPDATE bookings SET gateway_order_id = ? WHERE id = ?", [order.id, result.bookingId]);

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: result.totalAmount,
      bookingId: result.bookingId,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/payments/verify — verify signature + confirm booking + record ledger
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const booking = await getBookingForPayment(bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // If the webhook already confirmed it, just succeed (no double-recording)
    if (booking.status !== "confirmed") {
      const [[setting]] = await pool.query(
        "SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'"
      );
      const rate = setting ? Number(setting.setting_value) : 10;
      const commission = Math.round((booking.total_amount * rate) / 100);
      const ownerShare = booking.total_amount - commission;

      await confirmBookingPaid(bookingId);
      try {
        const paymentId = await recordPayment({
          bookingId,
          totalAmount: booking.total_amount,
          commission,
          ownerShare,
          gatewayPaymentId: razorpay_payment_id,
        });
        await recordOwnerEarning(bookingId, ownerShare, paymentId, `Booking #${bookingId}`);
      } catch (e) {
        if (e.code !== "ER_DUP_ENTRY") throw e;
      }
    }

    res.json({ message: "Payment successful, booking confirmed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/payments/cancel — release a held booking (payment abandoned)
export const cancelHeld = async (req, res) => {
  try {
    await releaseHeldBooking(req.body.bookingId, req.user.id);
    res.json({ message: "Booking released" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/payments/webhook  — Razorpay calls this server-to-server
export const webhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // req.body is the RAW Buffer here
      .digest("hex");
    if (expected !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString());
    const eventId = req.headers["x-razorpay-event-id"];

    // idempotency — process each event only once
    try {
      await pool.query(
        "INSERT INTO webhook_events (event_id, event_type, status) VALUES (?, ?, 'received')",
        [eventId, event.event]
      );
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return res.json({ status: "already processed" });
      throw e;
    }

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const [rows] = await pool.query(
        "SELECT id, total_amount, payment_status FROM bookings WHERE gateway_order_id = ?",
        [payment.order_id]
      );
      const booking = rows[0];

      if (booking && booking.payment_status !== "paid") {
        const [[setting]] = await pool.query(
          "SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'"
        );
        const rate = setting ? Number(setting.setting_value) : 10;
        const commission = Math.round((booking.total_amount * rate) / 100);
        const ownerShare = booking.total_amount - commission;

        await pool.query("UPDATE bookings SET status='confirmed', payment_status='paid' WHERE id = ?", [booking.id]);
        try {
          const paymentId = await recordPayment({
            bookingId: booking.id,
            totalAmount: booking.total_amount,
            commission,
            ownerShare,
            gatewayPaymentId: payment.id,
          });
          await recordOwnerEarning(booking.id, ownerShare, paymentId, `Booking #${booking.id}`);
        } catch (e) {
          if (e.code !== "ER_DUP_ENTRY") throw e;
        }
      }
    }

    await pool.query("UPDATE webhook_events SET status='processed', processed_at=NOW() WHERE event_id = ?", [eventId]);
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};