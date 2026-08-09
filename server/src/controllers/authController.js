import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserById } from "../models/userModel.js";
import {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
} from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";

const cookieBase = {
  httpOnly: true,                                 // JS can never read the tokens
  secure: process.env.NODE_ENV === "production",  // HTTPS only in production
  sameSite: "strict",                             // mitigates CSRF
};

// Set BOTH tokens as httpOnly cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });        // 15 min
  res.cookie("refreshToken", refreshToken, { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
};

// Generate both tokens, store refresh hash in DB, set both cookies
const issueAuthTokens = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await saveRefreshToken(user.id, refreshToken, expiresAt);
  setAuthCookies(res, accessToken, refreshToken);
};

// Shared registration logic — role is fixed by the caller, NOT the request body
const registerUser = async (req, res, role) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    if (await findUserByEmail(email))
      return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser({ name, email, phone, passwordHash, role });

    const user = { id: userId, role };
    await issueAuthTokens(res, user);
    res.status(201).json({
      message: "Account created",
      user: { id: userId, name, email, role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/auth/signup        → customer (from the Sign Up page)
export const signup = (req, res) => registerUser(req, res, "customer");

// POST /api/auth/register-owner → owner (from the "List your turf" page)
export const registerOwner = (req, res) => registerUser(req, res, "owner");

// POST /api/auth/login  (role is read from DB, never collected)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status !== "active")
      return res.status(403).json({ message: `Account is ${user.status}` });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    await issueAuthTokens(res, user);
    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/auth/refresh  (reads refresh cookie, sets a fresh access cookie)
export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const stored = await findRefreshToken(token);
    if (!stored) return res.status(403).json({ message: "Invalid refresh token" });

    const user = await findUserById(payload.id);
    if (!user) return res.status(403).json({ message: "User not found" });

    const accessToken = generateAccessToken(user);
    res.cookie("accessToken", accessToken, { ...cookieBase, maxAge: 15 * 60 * 1000 });
    res.json({ message: "Token refreshed" });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// POST /api/auth/logout  (revoke refresh token + clear both cookies)
export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await deleteRefreshToken(token);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};