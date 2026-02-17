import express from "express";
import { loginController, createAdminController } from "./auth.controller.js"; // Only import auth controllers

const router = express.Router();

// --- Auth Routes ---
router.post("/login", loginController);
router.post("/create-admin", createAdminController); // Use this once to setup

export default router;
