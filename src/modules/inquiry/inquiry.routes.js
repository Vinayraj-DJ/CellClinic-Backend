import express from "express";
import {
  createInquiry,
  getAllInquiries,
  updateInquiry,
  deleteInquiry,
  deleteAllInquiries,
} from "./inquiry.controller.js";

const router = express.Router();

router.post("/create", createInquiry);
router.get("/all", getAllInquiries);

// --- NEW ROUTES ---
router.put("/:id", updateInquiry); // Update specific order
router.delete("/all", deleteAllInquiries); // Delete ALL (Careful!)
router.delete("/:id", deleteInquiry); // Delete specific order

export default router;
