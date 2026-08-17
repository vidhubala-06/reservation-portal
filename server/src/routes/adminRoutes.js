import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { listPendingApplications, getApplication, approve, reject, listDisputes, resolveDispute, listFlaggedTurfs, suspendTurf, reinstateTurf, listOwners, listAllTurfs, removeTurf } from "../controllers/adminController.js";
const router = express.Router();

// every admin route requires a logged-in admin
router.use(protect, authorizeRoles("admin"));

router.get("/applications", listPendingApplications);
router.get("/applications/:id", getApplication);
router.patch("/applications/:id/approve", approve);
router.patch("/applications/:id/reject", reject);
router.get("/disputes", listDisputes);
router.post("/disputes/:id/resolve", resolveDispute);
router.get("/flagged-turfs", listFlaggedTurfs);
router.patch("/turfs/:id/suspend", suspendTurf);
router.patch("/turfs/:id/reinstate", reinstateTurf);
router.get("/owners", listOwners);
router.get("/turfs", listAllTurfs);
router.patch("/turfs/:id/remove", removeTurf);

export default router;