import express from "express";
import { listTurfs, getTurf } from "../controllers/turfController.js";

const router = express.Router();

router.get("/", listTurfs);      // GET /api/turfs
router.get("/:id", getTurf);     // GET /api/turfs/:id

export default router;