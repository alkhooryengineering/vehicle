const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up multer to store uploaded files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Email sending route
app.post("/send-pdf", upload.any(), async (req, res) => {
  try {
    const {
      vehicle,
      ake_department,
      other_department,
      reason_of_trip,
      date_field,
      driver_name
    } = req.body;

    // Handle department value if "Other" was selected
    const department = ake_department === "Other" ? other_department : ake_department;

    // Build the HTML table for the email body
    const emailBody = `
      <h3>New Vehicle Form Submission</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr><th align="left">Field</th><th align="left">Data</th></tr>
        <tr><td>Vehicle</td><td>${vehicle}</td></tr>
        <tr><td>AKE Department</td><td>${department}</td></tr>
        <tr><td>Reason of Trip</td><td>${reason_of_trip}</td></tr>
        <tr><td>Date</td><td>${date_field}</td></tr>
        <tr><td>Driver Name</td><td>${driver_name}</td></tr>
      </table>
    `;

    // Separate the files from the request
    const pdfFile = req.files.find(file => file.fieldname === "pdf");
    const photos = req.files.filter(file => file.fieldname.startsWith("photo"));

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Set this in your Render environment
        pass: process.env.EMAIL_PASS  // Set this in your Render environment
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "your-recipient@example.com", // Replace with actual recipient
      subject: "New AKE Vehicle Form Submission",
      html: emailBody,
      attachments: [
        // Attach the PDF file
        pdfFile
          ? {
              filename: pdfFile.originalname,
              content: pdfFile.buffer,
              contentType: "application/pdf"
            }
          : null,
        // Optional: Attach uploaded photos
        ...photos.map((photo) => ({
          filename: photo.originalname,
          content: photo.buffer,
          contentType: photo.mimetype
        }))
      ].filter(Boolean) // Remove any nulls if PDF is not attached
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).send("✅ Email Delivered");
  } catch (error) {
    console.error("❌ Email sending error:", error);
    res.status(500).send("❌ Submission failed. Please try again.");
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
