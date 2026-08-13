import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { listMyTurfs, getMyTurf, editMyTurf, blockTurfSlot, unblockTurfSlot } from "../controllers/ownerController.js";

const router = express.Router();
router.use(protect, authorizeRoles("owner"));

router.get("/turfs", listMyTurfs);
router.get("/turfs/:id", getMyTurf);
router.patch("/turfs/:id", editMyTurf);
router.post("/turfs/:id/block", blockTurfSlot);
router.post("/turfs/:id/unblock", unblockTurfSlot);

export default router;