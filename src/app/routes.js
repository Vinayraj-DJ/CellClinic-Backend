import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import catalogRoutes from "../modules/catalog/catalog.routes.js";
import inquiryRoutes from "../modules/inquiry/inquiry.routes.js";
import contactRoutes from "../modules/contact/contact.routes.js";
import backupRoutes from "../modules/backup/backup.routes.js"; // <--- Importjkdsf

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/inquiry", inquiryRoutes);
router.use("/contact", contactRoutes);
router.use("/backup", backupRoutes); // <--- Register

export default router;
