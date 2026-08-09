import jwt from "jsonwebtoken";

// Short-lived: sent with every API request
export const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

// Long-lived: used only to get new access tokens
export const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });