const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for GitHub Pages frontend
const allowedOrigins = ['https://alkhooryengineering.github.io'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Set up Multer for file uploads
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// POST endpoint to receive the form
app.post('/send-pdf', upload.any(), async (req, res) => {
  try {
    // Collect form data
    const { vehicle, akeDepartment, reasonOfTrip, date, driverName } = req.body;

    // Log the values to make sure they are correct
    console.log("Form Data Received:", { vehicle, akeDepartment, reasonOfTrip, date, driverName });

    // Create the tabular formatted email body
    const emailBody = `
      <h3>New Vehicle Form Submission:</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <th>Vehicle</th>
          <th>AKE Department</th>
          <th>Reason of Trip</th>
          <th>Date</th>
          <th>Driver Name</th>
        </tr>
        <tr>
          <td>${vehicle}</td>
          <td>${akeDepartment}</td>
          <td>${reasonOfTrip}</td>
          <td>${date}</td>
          <td>${driverName}</td>
        </tr>
      </table>
    `;

    // Log the email body to ensure the HTML is correct
    console.log("Email Body (HTML):", emailBody);

    // Handle attachments (PDF and images)
    const pdfFile = req.files.find(f => f.originalname.endsWith('.pdf'));
    const imageFiles = req.files.filter(f => f.fieldname.startsWith('photo'));

    // Set up nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options with attachments and formatted body
    const attachments = [
      {
        filename: 'order.pdf',
        content: pdfFile ? pdfFile.buffer : '',
      },
      ...imageFiles.map(file => ({
        filename: file.originalname,
        content: file.buffer,
      }))
    ];

    const mailOptions = {
      from: `"${driverName}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: 'New Order Form Submission',
      html: emailBody,  // Use HTML content for the table
      attachments,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).send('Email sending failed');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
