const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse form data and handle file uploads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure Multer for file uploads
const storage = multer.memoryStorage();  // Store files in memory
const upload = multer({ storage: storage });

// POST endpoint to handle form submission
app.post("/send-pdf", upload.any(), async (req, res) => {
  try {
    // Form fields from the submitted form data
    const { vehicle, reason_of_trip, driver_name, date_field } = req.body;

    // Files (photos and PDF) uploaded
    const photos = req.files.filter(file => file.fieldname.startsWith("photo"));
    const pdfFile = req.files.find(file => file.fieldname === "pdf");

    // Email body content
    let emailBody = `
      <h3>New Vehicle Form Submission</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr><th>Field</th><th>Data</th></tr>
        <tr><td><strong>Vehicle</strong></td><td>${vehicle}</td></tr>
        <tr><td><strong>Reason of Trip</strong></td><td>${reason_of_trip}</td></tr>
        <tr><td><strong>Driver Name</strong></td><td>${driver_name}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date_field}</td></tr>
    `;

    // Add photos to email body
    if (photos.length > 0) {
      emailBody += `<tr><td><strong>Uploaded Photos</strong></td><td>`;
      photos.forEach((photo, index) => {
        emailBody += `<img src="cid:photo${index}" alt="photo${index}" width="100" style="margin: 5px;" />`;
      });
      emailBody += `</td></tr>`;
    }

    // Add signature (if available)
    emailBody += `
      <tr><td><strong>Signature</strong></td><td><img src="cid:signature" alt="signature" width="150" /></td></tr>
    </table>
    `;

    // Add footer with submitted information
    emailBody += `
      <p><strong>Submitted by:</strong> ${driver_name}</p>
      <p><strong>Date:</strong> ${date_field}</p>
    `;

    // Create a transport object using SMTP (you can use Gmail or any other provider)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,  // Store email credentials in environment variables
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "recipient@example.com",  // Replace with your recipient email address
      subject: "New Vehicle Form Submission",
      html: emailBody,
      attachments: [
        // Attach the PDF
        {
          filename: pdfFile.originalname,
          content: pdfFile.buffer,
          encoding: "base64",
          contentType: "application/pdf"
        },
        // Attach the photos
        ...photos.map((photo, index) => ({
          filename: photo.originalname,
          content: photo.buffer,
          encoding: "base64",
          cid: `photo${index}`  // Use CID for inline images
        })),
        // Attach signature image (if available)
        {
          filename: "signature.png",
          content: req.body.signature, // Assume signature is sent as a data URL
          encoding: "base64",
          cid: "signature"  // CID for inline image
        }
      ]
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).send("✅ Email Delivered");
  } catch (error) {
    console.error("Error during form submission:", error);
    res.status(500).send("❌ Submission failed. Please try again.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
