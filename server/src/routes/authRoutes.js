import express from "express";
import { signup, login, refresh, logout, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/signup", signup);   // customer signup
router.post("/login", login);     // shared login for everyone
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;