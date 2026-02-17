import express from "express";
import { submitContactForm } from "./contact.controller.js";

const router = express.Router();

router.post("/submit", submitContactForm);

export default router;
