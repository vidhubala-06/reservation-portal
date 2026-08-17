import { getStaffTurf, getStaffTodayBookings, checkInByToken } from "../models/staffModel.js";

export const getMyTurf = async (req, res) => {
    try {
        const turf = await getStaffTurf(req.user.id);
        const bookings = await getStaffTodayBookings(req.user.id);
        res.json({ turf, bookings });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const checkin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "No QR token" });

        const result = await checkInByToken(req.user.id, token);
        const errs = {
            no_turf: [400, "No turf assigned"],
            invalid: [404, "Invalid QR — no matching booking"],
            wrong_turf: [403, "This booking is for a different turf"],
            not_confirmed: [400, "Booking is not confirmed"],
            too_early: [400, "Check-in opens 30 minutes before the slot"],
            expired: [400, "This booking's slot has already ended"],
        };
        if (result.error === "already") {
            return res.status(409).json({ message: `${result.booking.customer_name} is already checked in` });
        }
        if (result.error) {
            const [code, message] = errs[result.error] || [400, "Check-in failed"];
            return res.status(code).json({ message });
        }
        res.json({ message: `Checked in: ${result.booking.customer_name} (${result.booking.start_time.slice(0, 5)}–${result.booking.end_time.slice(0, 5)})` });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};