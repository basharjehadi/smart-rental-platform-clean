// Contract Generator Utility
export const generateRentalContract = (offer, user = null) => {
  // Get tenant signature from offer data - handle nested structure from backend
  let tenantSignature = offer.tenant?.signatureBase64 || offer.rentalRequest?.tenant?.signatureBase64 || null;
  
  // Get landlord signature from offer data
  let landlordSignature = offer.landlord?.signatureBase64 || null;
  
  // Clean up signature data - remove data URL prefix if present
  if (tenantSignature && tenantSignature.startsWith('data:image/')) {
    tenantSignature = tenantSignature.split(',')[1];
  }
  
  if (landlordSignature && landlordSignature.startsWith('data:image/')) {
    landlordSignature = landlordSignature.split(',')[1];
  }

  // Get payment date from offer or use current date as fallback
  const paymentDate = offer.paymentDate ? new Date(offer.paymentDate) : new Date();
  const contractDate = paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate lease dates
  const leaseStartDate = offer.availableFrom ? new Date(offer.availableFrom) : new Date();
  const leaseEndDate = new Date(leaseStartDate);
  leaseEndDate.setMonth(leaseEndDate.getMonth() + offer.leaseDuration);
  
  // Generate landlord-friendly payment schedule
  const generatePaymentSchedule = () => {
    if (!offer.availableFrom || !offer.rentAmount) {
      return [];
    }
    
    const schedule = [];
    const startDate = new Date(offer.availableFrom);
    const endDate = leaseEndDate;
    const monthlyRent = offer.rentAmount;

    // Start from the second month (first month is already paid)
    let currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);

    while (currentDate < endDate) {
      const dueDate = new Date(currentDate);
      dueDate.setDate(10);

      const isLastMonth = currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear();
      let amount = monthlyRent;
      let description = 'Monthly Rent';

      if (isLastMonth) {
        const daysInLastMonth = endDate.getDate();
        amount = Math.round((monthlyRent * daysInLastMonth) / 30);
        description = 'Final Month (Prorated)';
      }

      schedule.push({
        number: schedule.length + 1,
        dueDate: dueDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        amount: amount,
        description: description,
        isLastMonth: isLastMonth
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return schedule;
  };

  const paymentSchedule = generatePaymentSchedule();

  const contractData = {
    contractNumber: `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    date: contractDate,
    time: paymentDate.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    paymentTimestamp: paymentDate.toISOString(),
    
    // Tenant information
    tenantName: offer.rentalRequest?.tenant?.name || offer.tenant?.name || 'Tenant',
    tenantEmail: offer.rentalRequest?.tenant?.email || offer.tenant?.email || 'tenant@email.com',
    tenantPhone: offer.rentalRequest?.tenant?.phoneNumber || offer.tenant?.phoneNumber || 'N/A',
    tenantAddress: offer.rentalRequest?.tenant?.street || offer.tenant?.street || 'N/A',
    tenantCity: offer.rentalRequest?.tenant?.city || offer.tenant?.city || 'N/A',
    tenantZipCode: offer.rentalRequest?.tenant?.zipCode || offer.tenant?.zipCode || 'N/A',
    tenantCountry: offer.rentalRequest?.tenant?.country || offer.tenant?.country || 'Poland',
    tenantPESEL: offer.rentalRequest?.tenant?.pesel || offer.tenant?.pesel || 'N/A',
    tenantPassport: offer.rentalRequest?.tenant?.passportNumber || offer.tenant?.passportNumber || null,
    tenantResidenceCard: offer.rentalRequest?.tenant?.kartaPobytuNumber || offer.tenant?.kartaPobytuNumber || null,
    
    // Landlord information
    landlordName: offer.landlord?.name || 'Landlord',
    landlordEmail: offer.landlord?.email || 'landlord@email.com',
    landlordPhone: offer.landlord?.phoneNumber || 'N/A',
    landlordAddress: offer.landlord?.street || 'N/A',
    landlordCity: offer.landlord?.city || 'N/A',
    landlordZipCode: offer.landlord?.zipCode || 'N/A',
    landlordCountry: offer.landlord?.country || 'Poland',
    landlordPESEL: offer.landlord?.pesel || 'N/A',
    
    // Property information
    propertyAddress: offer.propertyAddress || offer.property?.address || 'N/A',
    propertyType: offer.propertyType || offer.property?.propertyType || 'N/A',
    
    // Lease information
    leaseDuration: offer.leaseDuration || 12,
    leaseStartDate: leaseStartDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    leaseEndDate: leaseEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    
    // Payment information
    rentAmount: offer.rentAmount || 0,
    depositAmount: offer.depositAmount || 0,
    paymentSchedule: paymentSchedule,
    
    // Signature data
    tenantSignature: tenantSignature,
    landlordSignature: landlordSignature
  };

  // Create a professional bilingual HTML contract template
  const contractHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Lease Agreement - ${contractData.contractNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 25mm 20mm;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Times New Roman', 'Times', serif; 
          margin: 0; 
          padding: 0; 
          line-height: 1.5; 
          color: #000;
          font-size: 11pt;
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 20mm;
          position: relative;
          background: white;
          margin-bottom: 10mm;
        }
        
        .page-number {
          position: absolute;
          bottom: 15mm;
          right: 20mm;
          font-size: 9pt;
          color: #333;
          font-weight: normal;
        }
        
        .header { 
          text-align: center; 
          margin-bottom: 35pt; 
          padding-bottom: 25pt;
          border-bottom: 2pt solid #000;
        }
        
        .main-title { 
          font-size: 20pt; 
          font-weight: bold; 
          margin-bottom: 10pt;
          text-transform: uppercase;
          letter-spacing: 2pt;
          line-height: 1.2;
        }
        
        .sub-title { 
          font-size: 16pt; 
          margin-bottom: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1pt;
        }
        
        .contract-number { 
          font-size: 13pt; 
          font-weight: bold; 
          margin-bottom: 18pt;
          text-decoration: underline;
          letter-spacing: 0.5pt;
        }
        
        .section { 
          margin-bottom: 25pt; 
          border: 1.5pt solid #000;
          border-radius: 3pt;
          padding: 20pt;
          background: white;
        }
        
        .section-title { 
          font-size: 14pt; 
          font-weight: bold; 
          margin-bottom: 15pt;
          text-transform: uppercase;
          letter-spacing: 1pt;
          border-bottom: 1pt solid #000;
          padding-bottom: 8pt;
        }
        
        .content { 
          font-size: 11pt; 
          line-height: 1.6;
          text-align: justify;
        }
        
        .signature-section {
          margin-top: 40pt;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .signature-box {
          width: 45%;
          text-align: center;
        }
        
        .signature-image {
          width: 150px;
          height: 80px;
          border: 1pt solid #000;
          margin: 10pt auto;
          display: block;
          object-fit: contain;
        }
        
        .signature-line {
          border-top: 1pt solid #000;
          margin-top: 15pt;
          padding-top: 8pt;
        }
        
        .signature-name {
          font-weight: bold;
          font-size: 12pt;
          margin-bottom: 5pt;
        }
        
        .signature-title {
          font-size: 10pt;
          color: #666;
        }
        
        .signature-date {
          font-size: 10pt;
          margin-top: 10pt;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="main-title">Lease Agreement</div>
          <div class="sub-title">Umowa Najmu</div>
          <div class="contract-number">Contract No. / Numer umowy: ${contractData.contractNumber}</div>
        </div>
        
        <div class="section">
          <div class="section-title">§1. Subject of the Agreement / Przedmiot Umowy</div>
          <div class="content">
            This lease agreement is concluded between the Landlord and the Tenant for the rental of the property located at ${contractData.propertyAddress}.
            <br><br>
            Niniejsza umowa najmu zostaje zawarta między Wynajmującym a Najemcą w celu wynajęcia nieruchomości położonej przy ${contractData.propertyAddress}.
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§2. Lease Term / Okres Najmu</div>
          <div class="content">
            The lease term is ${contractData.leaseDuration} months, starting from ${contractData.leaseStartDate} and ending on ${contractData.leaseEndDate}.
            <br><br>
            Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.leaseStartDate} i kończąc się ${contractData.leaseEndDate}.
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§3. Rent and Deposit / Czynsz i Kaucja</div>
          <div class="content">
            a) The monthly rent is ${contractData.rentAmount} PLN, payable in advance on the 10th day of each month.<br>
            b) The security deposit is ${contractData.depositAmount} PLN, which has been paid upon signing this agreement.
            <br><br>
            a) Miesięczny czynsz wynosi ${contractData.rentAmount} PLN, płatny z góry 10-go dnia każdego miesiąca.<br>
            b) Kaucja wynosi ${contractData.depositAmount} PLN, która została wpłacona przy podpisaniu niniejszej umowy.
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§4. Payment Schedule / Harmonogram Płatności</div>
          <div class="content">
            ${contractData.paymentSchedule.map(payment => 
              `${payment.number}. ${payment.description}: ${payment.amount} PLN - Due: ${payment.dueDate}`
            ).join('<br>')}
            <br><br>
            Harmonogram płatności został ustalony zgodnie z powyższymi terminami.
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§5. Utilities / Media</div>
          <div class="content">
            Utilities are included in Rent amount.
            <br><br>
            Media są wliczone w kwotę czynszu.
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§6. Signatures / Podpisy</div>
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-name">Landlord / Wynajmujący</div>
              <div class="signature-title">${contractData.landlordName}</div>
              ${contractData.landlordSignature ? `<img src="data:image/png;base64,${contractData.landlordSignature}" class="signature-image" alt="Landlord Signature">` : '<div class="signature-line"></div>'}
              <div class="signature-date">Date: ${contractData.date}</div>
            </div>
            <div class="signature-box">
              <div class="signature-name">Tenant / Najemca</div>
              <div class="signature-title">${contractData.tenantName}</div>
              ${contractData.tenantSignature ? `<img src="data:image/png;base64,${contractData.tenantSignature}" class="signature-image" alt="Tenant Signature">` : '<div class="signature-line"></div>'}
              <div class="signature-date">Date: ${contractData.date}</div>
            </div>
          </div>
        </div>
        
        <div class="page-number">1</div>
      </div>
    </body>
    </html>
  `;

  return contractHTML;
};

export const viewContract = async (offer, user = null) => {
  try {
    // Generate the contract HTML directly
    const contractHTML = generateRentalContract(offer, user);
    
    // Open the contract in a new window
    const newWindow = window.open('', '_blank');
    newWindow.document.write(contractHTML);
    newWindow.document.close();
    
    console.log('✅ Contract opened in new window successfully');
    return true;
  } catch (error) {
    console.error('❌ Error viewing contract:', error);
    throw new Error('Error viewing contract. Please try again.');
  }
};

export const downloadContract = async (offer, user = null) => {
  try {
    // Generate the contract HTML directly
    const contractHTML = generateRentalContract(offer, user);
    
    // Convert HTML to PDF using jsPDF and html2canvas
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contractHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      // Convert HTML to canvas
      const canvas = await html2canvas.default(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Download the PDF
      pdf.save(`Lease_Agreement_${offer.rentAmount}_PLN.pdf`);
      
      console.log('✅ Contract PDF downloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      // Fallback: download as HTML file
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lease_Agreement_${offer.rentAmount}_PLN.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Contract HTML downloaded as fallback');
      return true;
    }
  } catch (error) {
    console.error('❌ Error downloading contract:', error);
    throw new Error('Error downloading contract. Please try again.');
  }
};


