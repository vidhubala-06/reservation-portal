import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());              // allow the React frontend to call this API
app.use(express.json());      // parse incoming JSON request bodies

// Health-check route
app.get("/", (req, res) => {
  res.send("Reservation Portal API is running ✅");
});

// (Feature routes will be mounted here later, e.g. app.use("/api/auth", authRoutes))

export default app;