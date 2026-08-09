import crypto from "crypto";
import pool from "../config/db.js";

// Store/lookup only the hash — never the raw token
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const saveRefreshToken = async (userId, token, expiresAt) => {
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, hashToken(token), expiresAt]
  );
};

export const findRefreshToken = async (token) => {
  const [rows] = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token_hash = ?",
    [hashToken(token)]
  );
  return rows[0];
};

export const deleteRefreshToken = async (token) => {
  await pool.query("DELETE FROM refresh_tokens WHERE token_hash = ?", [
    hashToken(token),
  ]);
};