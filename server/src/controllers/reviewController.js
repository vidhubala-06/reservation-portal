import { createReview, getReviewsForTurf } from "../models/reviewModel.js";

export const addReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating) return res.status(400).json({ message: "bookingId and rating are required" });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const result = await createReview(bookingId, req.user.id, Number(rating), comment);
    if (result.error === "not_found") return res.status(404).json({ message: "Booking not found" });
    if (result.error === "not_reviewable") return res.status(400).json({ message: "Only confirmed bookings can be reviewed" });
    if (result.error === "already_reviewed") return res.status(400).json({ message: "You've already reviewed this booking" });

    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const listTurfReviews = async (req, res) => {
  try {
    res.json({ reviews: await getReviewsForTurf(req.params.turfId) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};