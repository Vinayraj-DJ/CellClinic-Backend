import Contact from "../../database/models/contact.model.js";
import sendEmail from "../../utils/email.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, mobile, description } = req.body;

    // 1. Validation
    if (!name || !email || !mobile || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. Save to Database
    const newContact = await Contact.create({
      name,
      email,
      mobile,
      description,
    });

    // 3. Send Email to Admin
    const adminEmail = "devakarthik8899@gmail.com";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">📬 New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> <a href="tel:${mobile}">${mobile}</a></p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <h3>Message:</h3>
        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${description}</p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `New Contact Message from ${name}`,
      html: emailHtml,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully!",
      data: newContact,
    });
  } catch (error) {
    console.error("Contact Form Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
