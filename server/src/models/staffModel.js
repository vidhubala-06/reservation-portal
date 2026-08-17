import pool from "../config/db.js";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getStaffTurf = async (staffUserId) => {
    const [[row]] = await pool.query(
        `SELECT t.id, t.name, t.location_address
     FROM turf_staff ts JOIN turfs t ON ts.turf_id = t.id
     WHERE ts.staff_user_id = ?`,
        [staffUserId]
    );
    return row || null;
};

export const getStaffTodayBookings = async (staffUserId) => {
    const [[st]] = await pool.query("SELECT turf_id FROM turf_staff WHERE staff_user_id = ?", [staffUserId]);
    if (!st) return [];
    const [rows] = await pool.query(
        `SELECT b.id, b.start_time, b.end_time, b.checked_in,
            u.name AS customer_name, u.phone AS customer_phone
     FROM bookings b JOIN users u ON b.customer_id = u.id
     WHERE b.turf_id = ? AND b.booking_date = ? AND b.status = 'confirmed'
     ORDER BY b.start_time ASC`,
        [st.turf_id, todayStr()]
    );
    return rows;
};

export const checkInByToken = async (staffUserId, token) => {
    const [[st]] = await pool.query("SELECT turf_id FROM turf_staff WHERE staff_user_id = ?", [staffUserId]);
    if (!st) return { error: "no_turf" };

    const [[booking]] = await pool.query(
        `SELECT b.id, b.turf_id, b.status, b.checked_in, b.booking_date, b.start_time, b.end_time,
            u.name AS customer_name
     FROM bookings b JOIN users u ON b.customer_id = u.id
     WHERE b.checkin_token = ?`,
        [token]
    );
    if (!booking) return { error: "invalid" };
    if (booking.turf_id !== st.turf_id) return { error: "wrong_turf" };
    if (booking.status !== "confirmed") return { error: "not_confirmed" };

    // build the slot's start/end datetimes from the booking date + times
    const bd = new Date(booking.booking_date);
    const dateStr = `${bd.getFullYear()}-${pad(bd.getMonth() + 1)}-${pad(bd.getDate())}`;
    const slotStart = new Date(`${dateStr}T${booking.start_time}`);
    const slotEnd = new Date(`${dateStr}T${booking.end_time}`);
    const windowOpen = new Date(slotStart.getTime() - 30 * 60 * 1000); // 30 min before start

    const now = new Date();
    if (now < windowOpen) return { error: "too_early" };
    if (now > slotEnd) return { error: "expired" };

    if (booking.checked_in) return { error: "already", booking };

    await pool.query("UPDATE bookings SET checked_in = TRUE, checked_in_at = NOW() WHERE id = ?", [booking.id]);
    return { ok: true, booking };
};