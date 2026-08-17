import { getNotifications, markAllRead } from "../models/notificationModel.js";

export const listNotifications = async (req, res) => {
  try {
    res.json({ notifications: await getNotifications(req.user.id) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const readAll = async (req, res) => {
  try {
    await markAllRead(req.user.id);
    res.json({ message: "ok" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};