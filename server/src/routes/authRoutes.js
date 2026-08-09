import express from "express";
import { signup, login, refresh, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);   // customer signup
router.post("/login", login);     // shared login for everyone
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;