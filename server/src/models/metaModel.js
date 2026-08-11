import pool from "../config/db.js";

export const getSports = async () => {
  const [rows] = await pool.query("SELECT id, name FROM sport_categories ORDER BY name");
  return rows;
};

export const getAmenities = async () => {
  const [rows] = await pool.query("SELECT id, name FROM amenities ORDER BY name");
  return rows;
};