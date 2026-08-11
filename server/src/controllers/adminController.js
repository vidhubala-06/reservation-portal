import {
  getPendingApplications, getApplicationById,
  approveApplication, rejectApplication,
} from "../models/applicationModel.js";
import { sendEmail } from "../utils/sendEmail.js";

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

export const approve = async (req, res) => {
  try {
    const result = await approveApplication(req.params.id);
    if (result.error === "not_found") return res.status(404).json({ message: "Application not found" });
    if (result.error === "already_approved") return res.status(400).json({ message: "Already approved" });

    try {
      await sendEmail({
        to: result.app.applicant_email,
        subject: "Your turf has been added 🎉",
        html: `<p>Hi ${result.app.applicant_name},</p>
               <p>Your turf "<strong>${result.app.turf_name}</strong>" has been approved and is now live on Reservation Portal.</p>
               <p>Log in and go to your Owner Dashboard to manage it.</p>`,
      });
    } catch (e) {
      console.error("Approval email failed:", e.message);
    }

    res.json({ message: "Approved — turf created and user upgraded to owner" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const reject = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await rejectApplication(req.params.id, reason);
    if (result.error === "not_found") return res.status(404).json({ message: "Application not found" });

    try {
      await sendEmail({
        to: result.app.applicant_email,
        subject: "Update on your turf application",
        html: `<p>Hi ${result.app.applicant_name},</p>
               <p>Your application for "<strong>${result.app.turf_name}</strong>" wasn't approved.</p>
               <p><strong>Reason:</strong> ${reason || "Not specified"}</p>`,
      });
    } catch (e) {
      console.error("Rejection email failed:", e.message);
    }

    res.json({ message: "Application rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};