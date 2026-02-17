import mongoose from "mongoose";
import { config } from "../config/index.js";

export const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    // Attempt connection
    await mongoose.connect(config.db.url, {
      // These options help prevent hanging connections
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) if DB is unreachable
      socketTimeoutMS: 45000, // Close idle connections
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection FAILED:", error.message);
    // CRITICAL: Kill the process. This tells Render/Vercel the app failed.
    process.exit(1);
  }
};
