import pool from "../config/db.js";

// Insert a new user, return the new id
export const createUser = async ({ name, email, phone, passwordHash, role }) => {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [name, email, phone, passwordHash, role]
  );
  return result.insertId;
};

// Find a user by email (used for login + duplicate check)
export const findUserByEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

// Find a user by id (used later by auth middleware)
export const findUserById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role, status FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};