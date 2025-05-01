<script>
  async function submitForm() {
    if (!validateForm()) return;

    const form = document.getElementById("VehicleForm");
    const formData = new FormData(form);

    if (selectedPhotos.length === 0) {
      alert("Please upload at least one photo.");
      return;
    }

    selectedPhotos.forEach((photo, index) => {
      formData.append("photo" + index, photo);
    });

    // Create the table structure for the email body
    const emailTable = `
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <tr><th colspan="2" style="text-align: center;">AKE Vehicle Form Submission</th></tr>
        <tr><td><strong>Vehicle:</strong></td><td>${formData.get("vehicle")}</td></tr>
        <tr><td><strong>AKE Department:</strong></td><td>${formData.get("ake_department")}</td></tr>
        <tr><td><strong>Reason of Trip:</strong></td><td>${formData.get("reason_of_trip")}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${formData.get("date_field")}</td></tr>
        <tr><td><strong>Driver Name:</strong></td><td>${formData.get("driver_name")}</td></tr>
        <tr><td><strong>Signature:</strong></td><td><img src="${signatureCanvas.toDataURL()}" alt="Signature" style="width: 100px; height: auto;" /></td></tr>
        <tr><td><strong>Photos:</strong></td><td>${selectedPhotos.length > 0 ? `<ul>${selectedPhotos.map(photo => `<li><img src="${URL.createObjectURL(photo)}" width="50px" /></li>`).join('')}</ul>` : 'No photos uploaded'}</td></tr>
      </table>
    `;

    // PDF generation and data sending to the server
    const opt = {
      margin: 0,
      filename: 'vehicle_form.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(document.getElementById('formToPDF')).toPdf().get('pdf').then(async function(pdf) {
      const pdfBlob = pdf.output("blob");
      formData.append("pdf", pdfBlob, "vehicle_form.pdf");

      const messageDiv = document.getElementById("message");
      try {
        const response = await fetch("https://ake-form-backend.onrender.com/send-pdf", {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            emailTable: emailTable, // Send the email in tabular format
            pdfBlob: pdfBlob
          })
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
</script>
