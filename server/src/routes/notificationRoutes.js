import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { listNotifications, readAll } from "../controllers/notificationController.js";

const router = express.Router();
router.get("/", protect, listNotifications);
router.patch("/read", protect, readAll);
export default router;