import pool from "../config/db.js";

// Booked + blocked slot times for a turf on a date (for the availability grid)
export const getAvailability = async (turfId, date) => {
  const [booked] = await pool.query(
    "SELECT slot_time FROM booked_slots WHERE turf_id = ? AND slot_date = ?",
    [turfId, date]
  );
  const [blocked] = await pool.query(
    "SELECT block_time AS slot_time FROM blocked_slots WHERE turf_id = ? AND block_date = ?",
    [turfId, date]
  );
  return { booked: booked.map((r) => r.slot_time), blocked: blocked.map((r) => r.slot_time) };
};

// Create a booking across consecutive 1-hour slots, atomically
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

    // build the consecutive slot times: "HH:00:00"
    const slotTimes = [];
    for (let h = startHour; h < startHour + durationHours; h++) {
      slotTimes.push(`${String(h).padStart(2, "0")}:00:00`);
    }

    // reject if any slot is blocked for maintenance
    const [blk] = await conn.query(
      "SELECT block_time FROM blocked_slots WHERE turf_id = ? AND block_date = ? AND block_time IN (?)",
      [turfId, bookingDate, slotTimes]
    );
    if (blk.length > 0) { await conn.rollback(); return { error: "slot_blocked" }; }

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

    // insert each slot — the UNIQUE(turf_id, slot_date, slot_time) guarantees no double-booking
    for (const st of slotTimes) {
      await conn.query(
        "INSERT INTO booked_slots (booking_id, turf_id, slot_date, slot_time) VALUES (?, ?, ?, ?)",
        [bookingId, turfId, bookingDate, st]
      );
    }

    await conn.commit();
    return { bookingId, totalAmount };
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") return { error: "slot_taken" }; // someone grabbed it first
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