import pool from "../config/db.js";

export const getAvailability = async (turfId, date) => {
  const [rows] = await pool.query(
    "SELECT slot_time, type FROM slot_reservations WHERE turf_id = ? AND slot_date = ?",
    [turfId, date]
  );
  return {
    booked: rows.filter((r) => r.type === "booked").map((r) => r.slot_time),
    blocked: rows.filter((r) => r.type === "blocked").map((r) => r.slot_time),
  };
};

export const createBooking = async ({ turfId, customerId, bookingDate, startHour, durationHours }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [turfRows] = await conn.query(
      "SELECT price_per_hour, opening_time, closing_time, status FROM turfs WHERE id = ?",
      [turfId]
    );
    const turf = turfRows[0];
    if (!turf || turf.status !== "approved") { await conn.rollback(); return { error: "turf_unavailable" }; }

    const openHour = parseInt(turf.opening_time.slice(0, 2), 10);
    const closeHour = parseInt(turf.closing_time.slice(0, 2), 10);
    if (startHour < openHour || startHour + durationHours > closeHour) {
      await conn.rollback(); return { error: "outside_hours" };
    }

    const slotTimes = [];
    for (let h = startHour; h < startHour + durationHours; h++) {
      slotTimes.push(`${String(h).padStart(2, "0")}:00:00`);
    }

    const totalAmount = turf.price_per_hour * durationHours;
    const startTime = slotTimes[0];
    const endTime = `${String(startHour + durationHours).padStart(2, "0")}:00:00`;

    const [bk] = await conn.query(
      `INSERT INTO bookings
         (turf_id, customer_id, booking_date, start_time, end_time, duration_hours, total_amount, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'unpaid')`,
      [turfId, customerId, bookingDate, startTime, endTime, durationHours, totalAmount]
    );
    const bookingId = bk.insertId;

    // Insert each slot as 'booked'. The unique constraint rejects any slot
    // that's already booked OR blocked — no turf lock needed.
    for (const st of slotTimes) {
      await conn.query(
        "INSERT INTO slot_reservations (turf_id, slot_date, slot_time, type, booking_id) VALUES (?, ?, ?, 'booked', ?)",
        [turfId, bookingDate, st, bookingId]
      );
    }

    await conn.commit();
    return { bookingId, totalAmount };
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") return { error: "slot_taken" }; // booked or blocked already
    throw err;
  } finally {
    conn.release();
  }
};

// A customer's bookings
export const getCustomerBookings = async (customerId) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.booking_date, b.start_time, b.end_time, b.duration_hours,
            b.total_amount, b.status,
            t.name AS turf_name, t.location_address
     FROM bookings b
     JOIN turfs t ON b.turf_id = t.id
     WHERE b.customer_id = ?
     ORDER BY b.booking_date DESC, b.start_time DESC`,
    [customerId]
  );
  return rows;
};