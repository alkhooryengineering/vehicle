async function submitForm() {
  if (!validateForm()) return;

  const form = document.getElementById("VehicleForm");
  const formData = new FormData(form);

  // Add form data to FormData object manually to ensure it's captured correctly
  formData.append("vehicle", document.getElementById("vehicle").value);
  formData.append("reason_of_trip", document.getElementById("reason_of_trip").value);
  formData.append("driver_name", document.getElementById("driver_name").value);
  formData.append("date_field", document.getElementById("date_field").value);
  
  // Add photos if selected
  if (selectedPhotos.length === 0) {
    alert("Please upload at least one photo.");
    return;
  }

  selectedPhotos.forEach((photo, index) => {
    formData.append("photo" + index, photo);
  });

  // Create a message body to send in the email
  let emailBody = `
    <h3>New Vehicle Form Submission</h3>
    <table border="1" cellpadding="5" cellspacing="0">
      <tr><th>Field</th><th>Data</th></tr>
      <tr><td><strong>Vehicle</strong></td><td>${document.getElementById("vehicle").value}</td></tr>
      <tr><td><strong>Reason of Trip</strong></td><td>${document.getElementById("reason_of_trip").value}</td></tr>
      <tr><td><strong>Driver Name</strong></td><td>${document.getElementById("driver_name").value}</td></tr>
      <tr><td><strong>Date</strong></td><td>${document.getElementById("date_field").value}</td></tr>
  `;

  // Check for uploaded photos and add them to the email body
  if (selectedPhotos.length > 0) {
    emailBody += `
      <tr><td><strong>Uploaded Photos</strong></td><td>`;
    selectedPhotos.forEach(photo => {
      emailBody += `<img src="${URL.createObjectURL(photo)}" alt="photo" width="100" style="margin: 5px;" />`;
    });
    emailBody += `</td></tr>`;
  }

  // Add signature (if available)
  const signatureCanvas = document.getElementById("signature");
  const signatureData = signatureCanvas.toDataURL("image/png");
  emailBody += `
      <tr><td><strong>Signature</strong></td><td><img src="${signatureData}" alt="signature" width="150" /></td></tr>
    </table>
  `;

  // Add a footer message
  emailBody += `
    <p><strong>Submitted by:</strong> ${document.getElementById("driver_name").value}</p>
    <p><strong>Date:</strong> ${document.getElementById("date_field").value}</p>
  `;

  // Set up HTML2PDF options
  const opt = {
    margin: 0,
    filename: 'vehicle_form.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // Generate PDF from form
  html2pdf().set(opt).from(document.getElementById('formToPDF')).toPdf().get('pdf').then(async function(pdf) {
    const pdfBlob = pdf.output("blob");
    formData.append("pdf", pdfBlob, "vehicle_form.pdf");

    // Now send the form data to the backend
    const messageDiv = document.getElementById("message");
    try {
      const response = await fetch("https://ake-form-backend.onrender.com/send-pdf", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        messageDiv.textContent = "✅ Email Delivered";
        messageDiv.style.color = "green";
        document.getElementById("submitBtn").style.display = "none";
      } else {
        messageDiv.textContent = "❌ Submission failed. Please try again.";
        messageDiv.style.color = "red";
      }
    } catch (error) {
      console.error("Error during submission:", error);
      messageDiv.textContent = "❌ Submission failed. Please try again.";
      messageDiv.style.color = "red";
    }
  });
}
