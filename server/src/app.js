import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import turfRoutes from "./routes/turfRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("Reservation Portal API is running ✅"));

app.use("/api/auth", authRoutes);
app.use("/api/turfs", turfRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/admin", adminRoutes);

export default app;