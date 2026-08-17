import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { reportDispute } from "../controllers/disputeController.js";

const router = express.Router();
router.post("/", protect, reportDispute);
export default router;