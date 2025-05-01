const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Allow requests from your frontend
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

// Multer setup
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// Endpoint
app.post('/send-pdf', upload.any(), async (req, res) => {
  try {
    // Extract data from request body
    const {
      vehicle,
      ake_department,
      reason_of_trip,
      date_field,
      driver_name,
      other_department
    } = req.body;

    const departmentToUse = ake_department === "Other" ? other_department : ake_department;

    // Create email body (HTML Table)
    const emailBody = `
      <h3>New Vehicle Form Submission</h3>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <th>Vehicle</th>
          <th>AKE Department</th>
          <th>Reason of Trip</th>
          <th>Date</th>
          <th>Driver Name</th>
        </tr>
        <tr>
          <td>${vehicle || '-'}</td>
          <td>${departmentToUse || '-'}</td>
          <td>${reason_of_trip || '-'}</td>
          <td>${date_field || '-'}</td>
          <td>${driver_name || '-'}</td>
        </tr>
      </table>
    `;

    // Handle uploaded files
    const pdfFile = req.files.find(f => f.originalname.endsWith('.pdf'));
    const imageFiles = req.files.filter(f => f.fieldname.startsWith('photo'));

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: `"${driver_name}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: 'New AKE Vehicle Form Submission',
      html: emailBody,
      attachments: [
        ...(pdfFile ? [{
          filename: 'form.pdf',
          content: pdfFile.buffer
        }] : []),
        ...imageFiles.map(file => ({
          filename: file.originalname,
          content: file.buffer
        }))
      ]
    };

    // Send email
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
