import razorpay from "../config/razorpay.js";
import {
  getAvailability,
  createBooking,
  getCustomerBookings,
  getBookingForCancel,
  cancelBooking as cancelBookingModel,
} from "../models/bookingModel.js";

export const availability = async (req, res) => {
  try {
    const { turfId, date } = req.query;
    if (!turfId || !date) return res.status(400).json({ message: "turfId and date are required" });
    res.json(await getAvailability(turfId, date));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const book = async (req, res) => {
  try {
    const { turfId, date, startHour, durationHours } = req.body;
    if (!turfId || !date || startHour == null || !durationHours) {
      return res.status(400).json({ message: "Missing booking details" });
    }
    const result = await createBooking({
      turfId, customerId: req.user.id, bookingDate: date,
      startHour: Number(startHour), durationHours: Number(durationHours),
    });
    const errors = {
      turf_unavailable: [400, "Turf is not available"],
      outside_hours: [400, "Selected time is outside operating hours"],
      slot_taken: [409, "One or more slots are no longer available — please pick another time"],
    };
    if (result.error) {
      const [code, message] = errors[result.error] || [400, "Booking failed"];
      return res.status(code).json({ message });
    }
    res.status(201).json({ message: "Booking confirmed", bookingId: result.bookingId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const myBookings = async (req, res) => {
  try {
    res.json({ bookings: await getCustomerBookings(req.user.id) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/bookings/:id/cancel
export const cancelBookingCtrl = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await getBookingForCancel(bookingId, req.user.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    // hours until the slot starts (built from local date parts to avoid timezone shift)
    const d = new Date(booking.booking_date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const slotStart = new Date(`${dateStr}T${booking.start_time}`);
    const hoursUntil = (slotStart.getTime() - Date.now()) / 3600000;

    // tiered refund
    let pct = 0;
    if (hoursUntil > 24) pct = 1;
    else if (hoursUntil > 6) pct = 0.5;
    else pct = 0;

    const total = booking.total_amount || 0;
    const refundAmount = Math.round(total * pct);
    const ownerReversal = Math.round((booking.owner_share || 0) * pct);
    const commissionRefunded = refundAmount - ownerReversal;
    const refundType = pct >= 1 ? "full" : "partial";
    const paymentStatus = pct >= 1 ? "refunded" : pct > 0 ? "partially_refunded" : "paid";

    // issue the Razorpay refund (test mode) if there's an amount
    if (refundAmount > 0 && booking.gateway_payment_id) {
      await razorpay.payments.refund(booking.gateway_payment_id, { amount: refundAmount });
    }

    await cancelBookingModel(bookingId, {
      refundAmount,
      ownerReversal,
      commissionRefunded,
      paymentId: booking.payment_id,
      reason: "cancellation",
      refundType,
      paymentStatus,
    });

    res.json({
      message: refundAmount > 0
        ? `Booking cancelled. ₹${(refundAmount / 100).toFixed(0)} refunded.`
        : "Booking cancelled. No refund (cancelled too close to the slot).",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};