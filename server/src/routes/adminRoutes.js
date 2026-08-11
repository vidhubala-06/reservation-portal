import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { listPendingApplications, getApplication } from "../controllers/adminController.js";

const router = express.Router();

// every admin route requires a logged-in admin
router.use(protect, authorizeRoles("admin"));

router.get("/applications", listPendingApplications);
router.get("/applications/:id", getApplication);

export default router;