app.post('/send-pdf', upload.any(), async (req, res) => {
  try {
    // Collect form data
    const { vehicle, akeDepartment, reasonOfTrip, date, driverName, otherDepartment } = req.body;

    // Log the values to make sure they are correct
    console.log("Form Data Received:", { vehicle, akeDepartment, reasonOfTrip, date, driverName, otherDepartment });

    // Create the tabular formatted email body
    const emailBody = `
      <h3>New Vehicle Form Submission:</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Vehicle</th>
          <th>AKE Department</th>
          <th>Reason of Trip</th>
          <th>Date</th>
          <th>Driver Name</th>
        </tr>
        <tr>
          <td>${vehicle}</td>
          <td>${akeDepartment === 'Other' ? otherDepartment : akeDepartment}</td> <!-- Handle "Other" dynamically -->
          <td>${reasonOfTrip}</td>
          <td>${date}</td>
          <td>${driverName}</td>
        </tr>
      </table>
    `;

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
