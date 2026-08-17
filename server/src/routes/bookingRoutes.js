import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { availability, book, myBookings, cancelBookingCtrl } from "../controllers/bookingController.js";

const router = express.Router();

router.get("/availability", availability);  // public: view free slots
router.post("/", protect, book);            // must be logged in to book
router.get("/my", protect, myBookings);
router.patch("/:id/cancel", protect, cancelBookingCtrl);

export default router;