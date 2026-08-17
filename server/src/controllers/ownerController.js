import { getOwnerTurfs, getOwnerTurfById, updateOwnerTurf, blockSlot, unblockSlot, getOwnerEarnings } from "../models/ownerModel.js";
import { getOwnerBookings } from "../models/ownerModel.js";

export const listMyTurfs = async (req, res) => {
  try {
    res.json({ turfs: await getOwnerTurfs(req.user.id) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getMyTurf = async (req, res) => {
  try {
    const turf = await getOwnerTurfById(req.params.id, req.user.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    res.json({ turf });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const editMyTurf = async (req, res) => {
  try {
    const { name, description, price_per_hour, size, surface_type, opening_time, closing_time, other_amenities } = req.body;
    if (!name || !price_per_hour || !opening_time || !closing_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const result = await updateOwnerTurf(req.params.id, req.user.id, {
      name, description,
      price_per_hour: Math.round(Number(price_per_hour) * 100),
      size, surface_type, opening_time, closing_time, other_amenities,
    });
    if (result.error === "not_found") return res.status(404).json({ message: "Turf not found" });
    res.json({ message: "Turf updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const blockTurfSlot = async (req, res) => {
  try {
    const { date, slotTime } = req.body;
    if (!date || !slotTime) return res.status(400).json({ message: "date and slotTime required" });
    const r = await blockSlot(req.params.id, req.user.id, date, slotTime);
    if (r.error === "not_found") return res.status(404).json({ message: "Turf not found" });
    if (r.error === "already_booked") return res.status(409).json({ message: "That slot is already booked" });
    res.json({ message: "Slot blocked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const unblockTurfSlot = async (req, res) => {
  try {
    const { date, slotTime } = req.body;
    if (!date || !slotTime) return res.status(400).json({ message: "date and slotTime required" });
    const r = await unblockSlot(req.params.id, req.user.id, date, slotTime);
    if (r.error === "not_found") return res.status(404).json({ message: "Turf not found" });
    res.json({ message: "Slot unblocked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listOwnerBookings = async (req, res) => {
  try {
    const bookings = await getOwnerBookings(req.user.id, req.query.date);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const earnings = async (req, res) => {
  try {
    res.json(await getOwnerEarnings(req.user.id));
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};