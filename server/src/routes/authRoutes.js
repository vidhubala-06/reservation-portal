import express from "express";
import { signup, registerOwner, login, refresh, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);            // customer signup page
router.post("/register-owner", registerOwner); // "List your turf" page
router.post("/login", login);              // shared login for everyone
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;