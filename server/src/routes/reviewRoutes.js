import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addReview, listTurfReviews } from "../controllers/reviewController.js";

const router = express.Router();
router.post("/", protect, addReview);
router.get("/turf/:turfId", listTurfReviews);
export default router;