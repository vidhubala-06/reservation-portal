import { getSports, getAmenities } from "../models/metaModel.js";

export const listSports = async (req, res) => {
  try {
    res.json({ sports: await getSports() });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listAmenities = async (req, res) => {
  try {
    res.json({ amenities: await getAmenities() });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};