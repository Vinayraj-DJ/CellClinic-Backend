import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },

    deviceModel: { type: String, required: true },

    // Array of objects { name: "Screen", price: 5000 }
    selectedServices: [
      {
        name: { type: String },
        price: { type: Number },
      },
    ],

    totalEstimatedPrice: { type: Number },

    status: {
      type: String,
      enum: ["Pending", "Contacted", "Resolved", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Inquiry", inquirySchema);
