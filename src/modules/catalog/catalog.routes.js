import express from "express";
import multer from "multer";
import { storage as cloudinaryStorage } from "../../config/cloudinary.js"; //

import {
  getBrands,
  getDevicesByBrand,
  getServicesByDevice,
  createBrand,
  updateBrand,
  deleteBrand,
  createDevice,
  updateDevice,
  deleteDevice,
  createService,
  updateService,
  deleteService,
  bulkUploadExcel,
  uploadBrandExcel,
  searchCatalog,
} from "./catalog.controller.js";

const router = express.Router();

// 1. FOR IMAGES: Use Cloudinary (Fixes the size limit)
const uploadImage = multer({ storage: cloudinaryStorage });

// 2. FOR EXCEL: Keep Memory Storage (Required for parsing)
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

// --- PUBLIC ---
router.get("/brands", getBrands);
router.get("/devices/:brandId", getDevicesByBrand);
router.get("/services/:deviceId", getServicesByDevice);
router.get("/search", searchCatalog);

// --- ADMIN (BRANDS) ---
router.post("/brand", uploadImage.single("image"), createBrand); // Changed to uploadImage
router.put("/brand/:id", uploadImage.single("image"), updateBrand); // Changed to uploadImage
router.delete("/brand/:id", deleteBrand);
router.post("/brand/:id/upload", uploadExcel.single("file"), uploadBrandExcel); // Keep uploadExcel

// --- ADMIN (DEVICES) ---
router.post("/device", uploadImage.single("image"), createDevice); // Changed to uploadImage
router.put("/device/:id", uploadImage.single("image"), updateDevice); // Changed to uploadImage
router.delete("/device/:id", deleteDevice);

// --- ADMIN (SERVICES) ---
router.post("/service", express.json(), createService);
router.put("/service/:id", express.json(), updateService);
router.delete("/service/:id", deleteService);

// --- ADMIN (GLOBAL EXCEL) ---
router.post("/upload", uploadExcel.single("file"), bulkUploadExcel); // Keep uploadExcel

export default router;
