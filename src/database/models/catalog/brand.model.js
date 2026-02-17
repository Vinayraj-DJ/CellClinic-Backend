import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    image: { type: String, required: true }, // Stores Base64 string or URL

    // --- Hero Section Fields ---
    title: { type: String }, // e.g. "Apple Repair Services"
    subtitle: { type: String }, // e.g. "Select Model"
    heroText: { type: String }, // e.g. "EXPERT IPHONE REPAIR"
    heroDesc: { type: String }, // e.g. "We provide the best..."

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Brand", brandSchema);
