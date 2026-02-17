import Inquiry from "../../database/models/inquiry.model.js";
import sendEmail from "../../utils/email.js";

// --- 1. Create Inquiry & Notify Admin ---
export const createInquiry = async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      deviceModel,
      selectedServices,
      totalEstimatedPrice,
    } = req.body;

    // 1. Validation
    if (!name || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Name and Mobile Number are required",
      });
    }

    // 2. Save to Database
    const newInquiry = await Inquiry.create({
      name,
      mobileNumber,
      deviceModel,
      selectedServices,
      totalEstimatedPrice,
    });

    // 3. Send Email Notification to ADMIN (You)
    const adminEmail = "devakarthik8899@gmail.com"; // <--- EMAILS GO HERE

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">🚀 New Repair Booking Received!</h2>
        <p><strong>Customer Name:</strong> ${name}</p>
        <p><strong>Mobile:</strong> <a href="tel:${mobileNumber}">${mobileNumber}</a></p>
        <p><strong>Device:</strong> ${deviceModel}</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <h3>Services Requested:</h3>
        <ul>
          ${selectedServices
            .map((s) => `<li>${s.name} - ₹${s.price}</li>`)
            .join("")}
        </ul>
        
        <h3 style="color: #22c55e;">Total Estimate: ₹${totalEstimatedPrice}</h3>
        
        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          This is an automated message from your Cell Clinic Website.
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `New Booking: ${name} - ${deviceModel}`,
      html: emailHtml,
    });

    return res.status(201).json({
      success: true,
      message: "Request received! Admin notified.",
      data: newInquiry,
    });
  } catch (error) {
    console.error("Create Inquiry Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- 2. Get All Inquiries (For Admin Dashboard) ---
export const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: inquiries });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      id,
      req.body,
      { new: true } // Return updated doc
    );

    if (!updatedInquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedInquiry,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. Delete Single Inquiry ---
export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await Inquiry.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. Delete All Inquiries ---
export const deleteAllInquiries = async (req, res) => {
  try {
    await Inquiry.deleteMany({});
    return res
      .status(200)
      .json({ success: true, message: "All orders deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
