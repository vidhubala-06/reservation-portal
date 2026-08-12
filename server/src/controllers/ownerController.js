import { getOwnerTurfs, getOwnerTurfById, updateOwnerTurf } from "../models/ownerModel.js";

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