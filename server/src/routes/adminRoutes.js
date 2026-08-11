import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { listPendingApplications, getApplication, approve, reject } from "../controllers/adminController.js";

const router = express.Router();

// every admin route requires a logged-in admin
router.use(protect, authorizeRoles("admin"));

router.get("/applications", listPendingApplications);
router.get("/applications/:id", getApplication);
router.patch("/applications/:id/approve", approve);
router.patch("/applications/:id/reject", reject);

export default router;