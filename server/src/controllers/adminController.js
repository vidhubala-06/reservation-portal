import { getPendingApplications, getApplicationById } from "../models/applicationModel.js";

export const listPendingApplications = async (req, res) => {
  try {
    res.json({ applications: await getPendingApplications() });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getApplication = async (req, res) => {
  try {
    const application = await getApplicationById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};