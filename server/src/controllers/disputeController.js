import { createDispute } from "../models/disputeModel.js";

export const reportDispute = async (req, res) => {
  try {
    const { bookingId, type, description } = req.body;
    if (!bookingId || !type) return res.status(400).json({ message: "bookingId and type are required" });
    const result = await createDispute(bookingId, req.user.id, type, description);
    if (result.error === "not_found") return res.status(404).json({ message: "Booking not found" });
    if (result.error === "already_open") return res.status(400).json({ message: "A report is already open for this booking" });
    res.status(201).json({ message: "Issue reported. Our team will review it." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};