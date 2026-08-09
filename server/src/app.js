import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// CORS must allow credentials so the cookie is sent from the frontend
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("Reservation Portal API is running ✅"));

app.use("/api/auth", authRoutes);

export default app;