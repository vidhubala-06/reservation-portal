import jwt from "jsonwebtoken";
import { findUserById } from "../models/userModel.js";

// Verify the access-token cookie and attach the user to the request
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await findUserById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.status !== "active")
      return res.status(403).json({ message: `Account is ${user.status}` });

    req.user = user; // { id, name, email, phone, role, status }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

// Restrict a route to specific roles, e.g. authorizeRoles("admin")
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};