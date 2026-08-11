import pool from "../config/db.js";

export const createApplication = async (data) => {
  const {
    existing_user_id,
    applicant_name, applicant_email, applicant_phone, pan_number,
    business_name, business_address,
    turf_name, sport_category_id, custom_sport, size, surface_type,
    location_address, latitude, longitude,
    price_per_hour, opening_time, closing_time,
    amenities, other_amenities, photos,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO turf_applications
       (existing_user_id, applicant_name, applicant_email, applicant_phone, pan_number,
        business_name, business_address,
        turf_name, sport_category_id, custom_sport, size, surface_type,
        location_address, latitude, longitude,
        price_per_hour, opening_time, closing_time,
        amenities, other_amenities, photos, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      existing_user_id || null,
      applicant_name, applicant_email, applicant_phone || null, pan_number || null,
      business_name || null, business_address || null,
      turf_name, sport_category_id || null, custom_sport || null, size, surface_type || null,
      location_address, latitude || null, longitude || null,
      price_per_hour, opening_time, closing_time,
      amenities || null, other_amenities || null, photos || null,
    ]
  );
  return result.insertId;
};

// List applications awaiting review
export const getPendingApplications = async () => {
  const [rows] = await pool.query(
    `SELECT ta.id, ta.turf_name, ta.applicant_name, ta.applicant_email,
            ta.location_address, ta.status, ta.created_at,
            COALESCE(sc.name, ta.custom_sport) AS sport
     FROM turf_applications ta
     LEFT JOIN sport_categories sc ON ta.sport_category_id = sc.id
     WHERE ta.status IN ('pending','needs_correction')
     ORDER BY ta.created_at ASC`
  );
  return rows;
};

// Handles both cases: already-parsed (JSON column) or a string
const parseJson = (val, fallback = []) => {
  if (val == null) return fallback;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val; // mysql2 already parsed the JSON column
};

export const getApplicationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ta.*, COALESCE(sc.name, ta.custom_sport) AS sport
     FROM turf_applications ta
     LEFT JOIN sport_categories sc ON ta.sport_category_id = sc.id
     WHERE ta.id = ?`,
    [id]
  );
  const app = rows[0];
  if (!app) return null;

  app.photos = parseJson(app.photos, []);
  app.amenities = parseJson(app.amenities, []);

  if (app.amenities.length > 0) {
    const [amenRows] = await pool.query("SELECT name FROM amenities WHERE id IN (?)", [app.amenities]);
    app.amenityNames = amenRows.map((a) => a.name);
  } else {
    app.amenityNames = [];
  }
  return app;
};

// Approve: upgrade user -> owner, create turf, promote photos/amenities, add custom sport
export const approveApplication = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [appRows] = await conn.query("SELECT * FROM turf_applications WHERE id = ? FOR UPDATE", [id]);
    const app = appRows[0];
    if (!app) { await conn.rollback(); return { error: "not_found" }; }
    if (app.status === "approved") { await conn.rollback(); return { error: "already_approved" }; }

    let sportId = app.sport_category_id;
    if (!sportId && app.custom_sport) {
      const [existing] = await conn.query("SELECT id FROM sport_categories WHERE name = ?", [app.custom_sport]);
      if (existing.length > 0) sportId = existing[0].id;
      else {
        const [ins] = await conn.query("INSERT INTO sport_categories (name) VALUES (?)", [app.custom_sport]);
        sportId = ins.insertId;
      }
    }

    await conn.query("UPDATE users SET role = 'owner' WHERE id = ?", [app.existing_user_id]);
    let ownerProfileId;
    const [op] = await conn.query("SELECT id FROM owner_profiles WHERE user_id = ?", [app.existing_user_id]);
    if (op.length > 0) {
      ownerProfileId = op[0].id;
      await conn.query(
        `UPDATE owner_profiles
         SET pan_number = COALESCE(?, pan_number),
             business_name = COALESCE(?, business_name),
             business_address = COALESCE(?, business_address)
         WHERE id = ?`,
        [app.pan_number, app.business_name, app.business_address, ownerProfileId]
      );
    } else {
      const [insOp] = await conn.query(
        "INSERT INTO owner_profiles (user_id, pan_number, business_name, business_address) VALUES (?, ?, ?, ?)",
        [app.existing_user_id, app.pan_number, app.business_name, app.business_address]
      );
      ownerProfileId = insOp.insertId;
    }

    const [turfIns] = await conn.query(
      `INSERT INTO turfs
        (owner_id, name, sport_category_id, size, surface_type, location_address,
         latitude, longitude, price_per_hour, opening_time, closing_time, other_amenities, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [ownerProfileId, app.turf_name, sportId, app.size, app.surface_type, app.location_address,
       app.latitude, app.longitude, app.price_per_hour, app.opening_time, app.closing_time, app.other_amenities]
    );
    const turfId = turfIns.insertId;

    const photos = parseJson(app.photos, []);
    for (let i = 0; i < photos.length; i++) {
      await conn.query(
        "INSERT INTO turf_images (turf_id, image_key, is_primary) VALUES (?, ?, ?)",
        [turfId, photos[i], i === 0]
      );
    }

    const amenities = parseJson(app.amenities, []);
    for (const amenityId of amenities) {
      await conn.query("INSERT IGNORE INTO turf_amenities (turf_id, amenity_id) VALUES (?, ?)", [turfId, amenityId]);
    }

    await conn.query("UPDATE turf_applications SET status = 'approved', sport_category_id = ? WHERE id = ?", [sportId, id]);

    await conn.commit();
    return { app, turfId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Reject with a reason
export const rejectApplication = async (id, reason) => {
  const [appRows] = await pool.query("SELECT * FROM turf_applications WHERE id = ?", [id]);
  const app = appRows[0];
  if (!app) return { error: "not_found" };
  await pool.query(
    "UPDATE turf_applications SET status = 'rejected', rejection_reason = ? WHERE id = ?",
    [reason || null, id]
  );
  return { app };
};