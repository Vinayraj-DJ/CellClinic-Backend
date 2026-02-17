import express from "express";
import multer from "multer";
import {
  exportAllData,
  restoreData,
  exportExcel,
  exportBrandExcel,
  exportEditableExcel,
  exportBrandEditableExcel, // <--- New Import
} from "./backup.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Backup & Restore (JSON) ---
router.get("/download", exportAllData);
router.post("/restore", upload.single("file"), restoreData);

// --- Excel Reports (ReadOnly / Separate Sheets) ---
router.get("/download-excel", exportExcel);
router.get("/download-excel/:brandId", exportBrandExcel);

// --- Editable Excel (Matches Import Format) ---
// 1. Download Entire Database in Import Format
router.get("/download-editable", exportEditableExcel);

// 2. Download Single Brand in Import Format (NEW)
router.get("/download-editable/:brandId", exportBrandEditableExcel);

export default router;
