import express from "express";
import { listSports, listAmenities } from "../controllers/metaController.js";

const router = express.Router();
router.get("/sports", listSports);
router.get("/amenities", listAmenities);
export default router;