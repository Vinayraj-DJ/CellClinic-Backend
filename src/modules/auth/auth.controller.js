import jwt from "jsonwebtoken";
import User from "../../database/models/user/user.model.js";
import { config } from "../../config/index.js";

// 1. Login (Email & Password)
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find Admin
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // Check Password
    const isMatch = await user.validatePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // Generate Token
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      config.jwt.accessSecret || "secretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: { email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Create Admin (Run this once via Postman)
export const createAdminController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check existing
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Admin already exists" });

    await User.create({ email, password, role: "admin" });

    res
      .status(201)
      .json({ success: true, message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
