import express from "express";
import { submitApplication } from "../controllers/applicationController.js";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// protect → must be logged in; then multer parses the photos
router.post("/", protect, upload.array("photos", 5), submitApplication);

export default router;