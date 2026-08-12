import { getAvailability, createBooking, getCustomerBookings } from "../models/bookingModel.js";

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
      slot_blocked: [409, "A selected slot is blocked for maintenance"],
      slot_taken: [409, "One or more slots were just booked — please pick another time"],
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