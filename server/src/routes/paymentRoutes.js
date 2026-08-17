import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createOrder, verifyPayment, cancelHeld } from "../controllers/paymentController.js";

const router = express.Router();
router.post("/order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.post("/cancel", protect, cancelHeld);

export default router;