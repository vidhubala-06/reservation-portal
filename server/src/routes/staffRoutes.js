import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getMyTurf, checkin } from "../controllers/staffController.js";

const router = express.Router();
router.use(protect, authorizeRoles("staff"));
router.get("/turf", getMyTurf);
router.post("/checkin", checkin);
export default router;