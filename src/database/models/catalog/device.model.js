import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true }, // URL to device image
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    // Type helps distinguish if you add Laptops later (e.g., 'mobile', 'tablet', 'laptop')
    type: { type: String, default: "mobile" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Device", deviceSchema);
