import razorpay from "../config/razorpay.js";
import { cancelBooking as cancelBookingModel } from "../models/bookingModel.js";
import {
  getPendingApplications, getApplicationById,
  approveApplication, rejectApplication,
} from "../models/applicationModel.js";
import {
  getOpenDisputes, getDisputeBookingInfo, markDisputeResolved, strikeTurf,
} from "../models/disputeModel.js";
import { getFlaggedTurfs, setTurfStatus, getOwners, getAllTurfs, getTurfOwnerInfo } from "../models/adminModel.js";
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

export const listDisputes = async (req, res) => {
  try {
    res.json({ disputes: await getOpenDisputes() });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/admin/disputes/:id/resolve  body: { action: 'refund' | 'deny' }
export const resolveDispute = async (req, res) => {
  try {
    const disputeId = req.params.id;
    const { action } = req.body;
    const info = await getDisputeBookingInfo(disputeId);
    if (!info) return res.status(404).json({ message: "Dispute not found" });
    if (info.dispute_status !== "open") return res.status(400).json({ message: "Dispute already resolved" });

    if (action === "deny") {
      await markDisputeResolved(disputeId, "denied");
      return res.json({ message: "Dispute denied." });
    }

    // full refund to customer; owner bears the FULL cost; platform keeps commission
    if (info.gateway_payment_id && info.total_amount > 0 && info.booking_status !== "cancelled") {
      await razorpay.payments.refund(info.gateway_payment_id, { amount: info.total_amount });
    }
    if (info.booking_status !== "cancelled") {
      await cancelBookingModel(info.booking_id, {
        refundAmount: info.total_amount || 0,
        ownerReversal: info.total_amount || 0, // owner reimburses the whole amount
        commissionRefunded: 0,                 // platform keeps its commission
        paymentId: info.payment_id,
        reason: "dispute",
        refundType: "full",
        paymentStatus: "refunded",
      });
    }
    await strikeTurf(info.turf_id);
    await markDisputeResolved(disputeId, "refunded");

    res.json({ message: "Customer refunded, cost charged to the owner, and a strike recorded on the turf." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listFlaggedTurfs = async (req, res) => {
  try {
    res.json({ turfs: await getFlaggedTurfs() });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const suspendTurf = async (req, res) => {
  try {
    await setTurfStatus(req.params.id, "taken_down");
    res.json({ message: "Turf suspended" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const reinstateTurf = async (req, res) => {
  try {
    await setTurfStatus(req.params.id, "approved");
    res.json({ message: "Turf reinstated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listOwners = async (req, res) => {
  try {
    res.json({ owners: await getOwners(req.query.search) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listAllTurfs = async (req, res) => {
  try {
    res.json({ turfs: await getAllTurfs() });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const removeTurf = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "A reason is required" });

    const info = await getTurfOwnerInfo(req.params.id);
    if (!info) return res.status(404).json({ message: "Turf not found" });

    await setTurfStatus(req.params.id, "taken_down");

    // notify the owner (non-blocking)
    try {
      await sendEmail({
        to: info.owner_email,
        subject: `Your turf "${info.turf_name}" has been removed`,
        html: `<p>Hi ${info.owner_name},</p>
               <p>Your turf "<strong>${info.turf_name}</strong>" has been removed from Reservation Portal by our team.</p>
               <p><strong>Reason:</strong> ${reason}</p>
               <p>If you believe this is a mistake, please contact support.</p>`,
      });
    } catch (e) {
      console.error("Removal email failed:", e.message);
    }

    res.json({ message: "Turf removed and owner notified." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};