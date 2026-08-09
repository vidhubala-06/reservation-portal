import jwt from "jsonwebtoken";

// Short-lived access token (sent with every request), carries id + role
export const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

// Long-lived refresh token (used only to mint new access tokens), carries id
export const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });