// src/utils/email.js
import nodemailer from "nodemailer";
import { config } from "../config/index.js";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // <--- CHANGED: Standard port for cloud servers
    secure: false, // <--- CHANGED: Must be false for 587
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    family: 4, // Keep this to force IPv4

    // TIMEOUT SETTINGS (Fail fast in 10s as requested)
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    logger: true,
    debug: true,
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log(`🚀 Attempting to email ${to} on Port 587...`);
    const transporter = createTransporter();

    await transporter.verify();
    console.log("✅ SMTP Connection Verified");

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email Failed:", error.message);
    throw new Error("Email Failed");
  }
};

export default sendEmail;
