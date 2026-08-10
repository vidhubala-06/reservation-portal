import { getApprovedTurfs, getTurfById } from "../models/turfModel.js";

// GET /api/turfs
export const listTurfs = async (req, res) => {
  try {
    const turfs = await getApprovedTurfs();
    res.json({ turfs });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/turfs/:id
export const getTurf = async (req, res) => {
  try {
    const turf = await getTurfById(req.params.id);
    if (!turf) return res.status(404).json({ message: "Turf not found" });
    res.json({ turf });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};