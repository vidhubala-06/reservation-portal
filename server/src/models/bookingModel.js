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
     ORDER BY b.id DESC`,
    [customerId]
  );
  return rows;
};

// Reserve slots as a HELD booking (pending payment)
export const createHeldBooking = async ({ turfId, customerId, bookingDate, startHour, durationHours }) => {
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

    // enforce the 7-day booking window (today .. today + 6)
    const pad = (n) => String(n).padStart(2, "0");
    const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayStr = fmtDate(new Date());
    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 6);
    const maxStr = fmtDate(maxD);
    if (bookingDate < todayStr || bookingDate > maxStr) {
      await conn.rollback();
      return { error: "outside_window" };
    }

    // reject slots that have already passed today
    if (bookingDate === todayStr) {
      const nowHour = new Date().getHours();
      if (startHour <= nowHour) {
        await conn.rollback();
        return { error: "past_slot" };
      }
    }

    const slotTimes = [];
    for (let h = startHour; h < startHour + durationHours; h++) {
      slotTimes.push(`${String(h).padStart(2, "0")}:00:00`);
    }

    const totalAmount = turf.price_per_hour * durationHours;
    const startTime = slotTimes[0];
    const endTime = `${String(startHour + durationHours).padStart(2, "0")}:00:00`;
    const holdExpires = new Date(Date.now() + 15 * 60 * 1000);

    const [bk] = await conn.query(
      `INSERT INTO bookings
         (turf_id, customer_id, booking_date, start_time, end_time, duration_hours, total_amount, status, payment_status, hold_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'held', 'unpaid', ?)`,
      [turfId, customerId, bookingDate, startTime, endTime, durationHours, totalAmount, holdExpires]
    );
    const bookingId = bk.insertId;

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
    if (err.code === "ER_DUP_ENTRY") return { error: "slot_taken" };
    throw err;
  } finally {
    conn.release();
  }
};

export const confirmBookingPaid = async (bookingId) => {
  await pool.query("UPDATE bookings SET status='confirmed', payment_status='paid' WHERE id = ?", [bookingId]);
};

// Release a held booking (deletes it; slot_reservations cascade-delete)
export const releaseHeldBooking = async (bookingId, customerId) => {
  await pool.query("DELETE FROM bookings WHERE id = ? AND customer_id = ? AND status = 'held'", [bookingId, customerId]);
};

export const getBookingForPayment = async (bookingId, customerId) => {
  const [rows] = await pool.query(
    "SELECT id, total_amount, status FROM bookings WHERE id = ? AND customer_id = ?",
    [bookingId, customerId]
  );
  return rows[0] || null;
};

// Booking + its payment details, for cancellation
export const getBookingForCancel = async (bookingId, customerId) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.status, b.payment_status, b.booking_date, b.start_time,
            p.id AS payment_id, p.gateway_payment_id, p.owner_share, p.total_amount
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.id = ? AND b.customer_id = ?`,
    [bookingId, customerId]
  );
  return rows[0] || null;
};

// Cancel: mark booking, free slots, log refund, reverse owner earning — atomically
export const cancelBooking = async (bookingId, {
  refundAmount, ownerReversal, commissionRefunded, paymentId, reason, refundType, paymentStatus,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("UPDATE bookings SET status='cancelled', payment_status=? WHERE id=?", [paymentStatus, bookingId]);
    await conn.query("DELETE FROM slot_reservations WHERE booking_id=?", [bookingId]); // free the slots

    if (paymentId && refundAmount > 0) {
      await conn.query(
        `INSERT INTO refunds (payment_id, refund_amount, reason, refund_type, commission_refunded_amount, owner_debited, status)
         VALUES (?, ?, ?, ?, ?, ?, 'succeeded')`,
        [paymentId, refundAmount, reason, refundType, commissionRefunded, ownerReversal]
      );
    }

    if (ownerReversal > 0) {
      const [[owner]] = await conn.query(
        `SELECT op.id FROM bookings b
         JOIN turfs t ON b.turf_id=t.id
         JOIN owner_profiles op ON t.owner_id=op.id
         WHERE b.id=?`,
        [bookingId]
      );
      if (owner) {
        await conn.query(
          "INSERT INTO owner_balance_transactions (owner_id, payment_id, amount, type, reason) VALUES (?, ?, ?, 'clawback', ?)",
          [owner.id, paymentId, -ownerReversal, `Refund for booking #${bookingId}`]
        );
        await conn.query("UPDATE owner_profiles SET balance = balance - ? WHERE id=?", [ownerReversal, owner.id]);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};