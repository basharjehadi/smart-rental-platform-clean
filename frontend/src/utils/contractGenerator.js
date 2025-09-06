// Contract Generator Utility
export const generateRentalContract = (offer, user = null) => {
  // Get tenant signature from offer data - handle nested structure from backend
  let tenantSignature =
    offer.tenant?.signatureBase64 ||
    offer.rentalRequest?.tenant?.signatureBase64 ||
    null;

  // Get landlord signature from offer data
  let landlordSignature = offer.landlord?.signatureBase64 || null;

  // Clean up signature data - remove data URL prefix if present
  if (tenantSignature && tenantSignature.startsWith('data:image/')) {
    tenantSignature = tenantSignature.split(',')[1];
  }

  if (landlordSignature && landlordSignature.startsWith('data:image/')) {
    landlordSignature = landlordSignature.split(',')[1];
  }

  // Get payment date from offer - this should be the original payment date when contract was first generated
  const paymentDate = offer.paymentDate
    ? new Date(offer.paymentDate)
    : new Date();

  // Use the original payment date for contract date to maintain legal validity
  const contractDate = paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  console.log(
    '🔍 Contract Generator - Using original payment date for contract:',
    {
      originalPaymentDate: offer.paymentDate,
      parsedDate: paymentDate,
      contractDate: contractDate,
    }
  );

  // Calculate lease dates
  const leaseStartDate = offer.availableFrom
    ? new Date(offer.availableFrom)
    : new Date();
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

      const isLastMonth =
        currentDate.getMonth() === endDate.getMonth() &&
        currentDate.getFullYear() === endDate.getFullYear();
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
          day: 'numeric',
        }),
        amount: amount,
        description: description,
        isLastMonth: isLastMonth,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return schedule;
  };

  const paymentSchedule = generatePaymentSchedule();

  // Debug: Log the offer structure to see what data is available
  console.log('🔍 Contract Generator - Offer structure:', {
    offerKeys: Object.keys(offer),
    rentalRequest: offer.rentalRequest,
    tenant: offer.tenant,
    rentalRequestTenant: offer.rentalRequest?.tenant,
    landlord: offer.landlord,
  });

  // Ensure tenant data is properly available
  const tenantData = offer.rentalRequest?.tenant || offer.tenant || user;
  console.log('🔍 Contract Generator - Tenant data source:', {
    rentalRequestTenant: offer.rentalRequest?.tenant,
    offerTenant: offer.tenant,
    userData: user,
    finalTenantData: tenantData,
  });

  const contractData = {
    contractNumber:
      offer.originalContractNumber ||
      `SR-${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${Math.floor(
        Math.random() * 9999
      )
        .toString()
        .padStart(4, '0')}`,
    date: contractDate,
    time: paymentDate.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    paymentTimestamp: paymentDate.toISOString(),

    // Tenant information - using properly extracted tenant data
    tenantName: tenantData?.name || 'Tenant',
    tenantEmail: tenantData?.email || 'tenant@email.com',
    tenantPhone: tenantData?.phoneNumber || 'N/A',
    tenantAddress: tenantData?.street || 'N/A',
    tenantCity: tenantData?.city || 'N/A',
    tenantZipCode: tenantData?.zipCode || 'N/A',
    tenantCountry: tenantData?.country || 'Poland',
    tenantPESEL: tenantData?.pesel || 'N/A',
    tenantPassport: tenantData?.passportNumber || null,
    tenantResidenceCard: tenantData?.kartaPobytuNumber || null,

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
      day: 'numeric',
    }),
    leaseEndDate: leaseEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),

    // Payment information
    rentAmount: offer.rentAmount || 0,
    depositAmount: offer.depositAmount || 0,
    paymentSchedule: paymentSchedule,

    // Signature data
    tenantSignature: tenantSignature,
    landlordSignature: landlordSignature,
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
          line-height: 1.6; 
          color: #000;
          font-size: 11pt;
          background: white;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 20mm;
          position: relative;
          background: white;
          margin: 0 auto;
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
          margin-bottom: 40pt; 
          padding-bottom: 20pt;
          border-bottom: 2pt solid #000;
        }
        
        .main-title { 
          font-size: 22pt; 
          font-weight: bold; 
          margin-bottom: 8pt;
          text-transform: uppercase;
          letter-spacing: 1pt;
          line-height: 1.2;
        }
        
        .sub-title { 
          font-size: 16pt; 
          margin-bottom: 10pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
        }
        
        .contract-number { 
          font-size: 12pt; 
          font-weight: bold; 
          margin-bottom: 15pt;
          text-decoration: underline;
        }
        
        .contract-date {
          font-size: 11pt;
          margin-bottom: 10pt;
        }
        
        .section { 
          margin-bottom: 25pt; 
        }
        
        .section-title { 
          font-size: 13pt; 
          font-weight: bold; 
          margin-bottom: 12pt;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
          border-bottom: 1pt solid #000;
          padding-bottom: 5pt;
        }
        
        .content { 
          font-size: 11pt; 
          line-height: 1.6;
          text-align: justify;
          margin-bottom: 10pt;
        }
        
        .bilingual-content {
          display: flex;
          gap: 15pt;
          margin-bottom: 15pt;
        }
        
        .english-content {
          flex: 1;
          text-align: left;
          border-right: 1pt solid #ccc;
          padding-right: 8pt;
        }
        
        .polish-content {
          flex: 1;
          text-align: left;
          padding-left: 8pt;
        }
        
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15pt 0;
          font-size: 10pt;
        }
        
        .payment-table th,
        .payment-table td {
          border: 1pt solid #000;
          padding: 8pt;
          text-align: center;
        }
        
        .payment-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .payment-table .amount {
          text-align: right;
          font-weight: bold;
        }
        
        .parties-section {
          margin: 25pt 0;
        }
        
        .party-info {
          margin-bottom: 15pt;
        }
        
        .party-title {
          font-weight: bold;
          font-size: 12pt;
          margin-bottom: 8pt;
          text-transform: uppercase;
        }
        
        .party-details {
          font-size: 11pt;
          line-height: 1.4;
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
          width: 120px;
          height: 60px;
          border: 1pt solid #000;
          margin: 10pt auto;
          display: block;
          object-fit: contain;
        }
        
        .signature-line {
          border-top: 1pt solid #000;
          margin-top: 15pt;
          padding-top: 8pt;
          width: 120px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .signature-name {
          font-weight: bold;
          font-size: 11pt;
          margin-bottom: 5pt;
        }
        
        .signature-title {
          font-size: 9pt;
          color: #666;
          margin-bottom: 8pt;
        }
        
        .signature-date {
          font-size: 9pt;
          margin-top: 10pt;
        }
        
        .footer {
          position: absolute;
          bottom: 25mm;
          left: 20mm;
          right: 20mm;
          text-align: center;
          font-size: 9pt;
          color: #666;
          border-top: 1pt solid #ccc;
          padding-top: 8pt;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="main-title">Lease Agreement</div>
          <div class="sub-title">Umowa Najmu</div>
          <div class="contract-number">Contract No. / Numer umowy: ${contractData.contractNumber}</div>
          <div class="contract-date">Date / Data: ${contractData.date}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Parties / Strony</div>
          <div class="bilingual-content">
            <div class="english-content">
              <div class="party-title">Landlord</div>
              <div class="party-details">
                Name: ${contractData.landlordName}<br>
                Email: ${contractData.landlordEmail}<br>
                Phone: ${contractData.landlordPhone}<br>
                Address: ${contractData.landlordAddress}, ${contractData.landlordCity}, ${contractData.landlordZipCode}, ${contractData.landlordCountry}<br>
                PESEL: ${contractData.landlordPESEL}
              </div>
              
              <div class="party-title" style="margin-top: 20pt;">Tenant</div>
              <div class="party-details">
                Name: ${contractData.tenantName}<br>
                Email: ${contractData.tenantEmail}<br>
                Phone: ${contractData.tenantPhone}<br>
                Address: ${contractData.tenantAddress}, ${contractData.tenantCity}, ${contractData.tenantZipCode}, ${contractData.tenantCountry}<br>
                PESEL: ${contractData.tenantPESEL}${contractData.tenantPassport ? '<br>Passport: ' + contractData.tenantPassport : ''}${contractData.tenantResidenceCard ? '<br>Residence Card: ' + contractData.tenantResidenceCard : ''}
              </div>
            </div>
            <div class="polish-content">
              <div class="party-title">Wynajmujący</div>
              <div class="party-details">
                Imię i nazwisko: ${contractData.landlordName}<br>
                Email: ${contractData.landlordEmail}<br>
                Telefon: ${contractData.landlordPhone}<br>
                Adres: ${contractData.landlordAddress}, ${contractData.landlordCity}, ${contractData.landlordZipCode}, ${contractData.landlordCountry}<br>
                PESEL: ${contractData.landlordPESEL}
              </div>
              
              <div class="party-title" style="margin-top: 20pt;">Najemca</div>
              <div class="party-details">
                Imię i nazwisko: ${contractData.tenantName}<br>
                Email: ${contractData.tenantEmail}<br>
                Telefon: ${contractData.tenantPhone}<br>
                Adres: ${contractData.tenantAddress}, ${contractData.tenantCity}, ${contractData.tenantZipCode}, ${contractData.tenantCountry}<br>
                PESEL: ${contractData.tenantPESEL}${contractData.tenantPassport ? '<br>Paszport: ' + contractData.tenantPassport : ''}${contractData.tenantResidenceCard ? '<br>Karta pobytu: ' + contractData.tenantResidenceCard : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§1. Subject of the Agreement / Przedmiot Umowy</div>
          <div class="bilingual-content">
            <div class="english-content">
              This lease agreement is concluded between the Landlord and the Tenant for the rental of the property located at ${contractData.propertyAddress}. The Landlord declares that he/she is the owner of the real estate property located at: ${contractData.propertyAddress}.
            </div>
            <div class="polish-content">
              Niniejsza umowa najmu zostaje zawarta między Wynajmującym a Najemcą w celu wynajęcia nieruchomości położonej przy ${contractData.propertyAddress}. Wynajmujący oświadcza, że jest właścicielem nieruchomości położonej przy: ${contractData.propertyAddress}.
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§2. Lease Term / Okres Najmu</div>
          <div class="bilingual-content">
            <div class="english-content">
              The lease term is ${contractData.leaseDuration} months, starting from ${contractData.leaseStartDate} and ending on ${contractData.leaseEndDate}.
            </div>
            <div class="polish-content">
              Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.leaseStartDate} i kończąc się ${contractData.leaseEndDate}.
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§3. Rent and Deposit / Czynsz i Kaucja</div>
          <div class="bilingual-content">
            <div class="english-content">
              a) The monthly rent is ${contractData.rentAmount} PLN, payable in advance on the 10th day of each month. The tenant agrees to pay the monthly rent by the 10th of each month.<br><br>
              b) The security deposit is ${contractData.depositAmount} PLN, which has been paid upon signing this agreement.
            </div>
            <div class="polish-content">
              a) Miesięczny czynsz wynosi ${contractData.rentAmount} PLN, płatny z góry 10-go dnia każdego miesiąca. Najemca zgadza się płacić czynsz miesięczny do 10-go dnia każdego miesiąca.<br><br>
              b) Kaucja wynosi ${contractData.depositAmount} PLN, która została wpłacona przy podpisaniu niniejszej umowy.
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§4. Payment Schedule / Harmonogram Płatności</div>
          <div class="bilingual-content">
            <div class="english-content">
              <table class="payment-table">
                <thead>
                  <tr>
                    <th>Payment No.</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${contractData.paymentSchedule
                    .map(
                      payment => `
                    <tr>
                      <td>${payment.number}</td>
                      <td>${payment.dueDate}</td>
                      <td class="amount">${payment.amount} PLN</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
            <div class="polish-content">
              <table class="payment-table">
                <thead>
                  <tr>
                    <th>Nr płatności</th>
                    <th>Termin płatności</th>
                    <th>Kwota</th>
                  </tr>
                </thead>
                <tbody>
                  ${contractData.paymentSchedule
                    .map(
                      payment => `
                    <tr>
                      <td>${payment.number}</td>
                      <td>${payment.dueDate}</td>
                      <td class="amount">${payment.amount} PLN</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§5. Utilities / Media</div>
          <div class="bilingual-content">
            <div class="english-content">
              Utilities are included in Rent amount.
            </div>
            <div class="polish-content">
              Media są wliczone w kwotę czynszu.
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§6. Tenant Protection / Ochrona Najemcy</div>
          <div class="bilingual-content">
            <div class="english-content">
              The tenant has the right to request a full refund within 24 hours after check-in if the property does not match the description or if there are significant issues with the property.
            </div>
            <div class="polish-content">
              Najemca ma prawo zażądać pełnego zwrotu w ciągu 24 godzin po zameldowaniu, jeśli nieruchomość nie odpowiada opisowi lub jeśli występują istotne problemy z nieruchomością.
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">§7. Signatures / Podpisy</div>
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
        
        <div class="footer">
          This document was generated by Smart Rental System on ${contractData.date}. Legally binding.
        </div>
        
        <div class="page-number">1</div>
      </div>
    </body>
    </html>
  `;

  return contractHTML;
};

export const viewContract = async (offer, user = null, leaseData = null) => {
  try {
    // If lease data is provided (for renewals), merge it with offer data
    let contractData = { ...offer };
    
    if (leaseData) {
      console.log('🔄 Using lease data for contract generation:', leaseData);
      contractData = {
        ...offer,
        // Override with lease data for renewals
        rentAmount: leaseData.rentAmount || offer.rentAmount,
        leaseDuration: leaseData.leaseDuration || offer.leaseDuration,
        availableFrom: leaseData.startDate || offer.availableFrom,
        // Calculate end date from lease data
        leaseEndDate: leaseData.endDate || offer.leaseEndDate,
      };
    }
    
    // Generate the contract HTML directly
    const contractHTML = generateRentalContract(contractData, user);

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

export const downloadContract = async (offer, user = null, leaseData = null) => {
  try {
    // If lease data is provided (for renewals), merge it with offer data
    let contractData = { ...offer };
    
    if (leaseData) {
      console.log('🔄 Using lease data for contract download:', leaseData);
      contractData = {
        ...offer,
        // Override with lease data for renewals
        rentAmount: leaseData.rentAmount || offer.rentAmount,
        leaseDuration: leaseData.leaseDuration || offer.leaseDuration,
        availableFrom: leaseData.startDate || offer.availableFrom,
        // Calculate end date from lease data
        leaseEndDate: leaseData.endDate || offer.leaseEndDate,
      };
    }
    
    // Generate the contract HTML directly
    const contractHTML = generateRentalContract(contractData, user);

    // Convert HTML to PDF using jsPDF and html2canvas
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');

      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contractHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.height = 'auto';
      tempDiv.style.backgroundColor = 'white';
      document.body.appendChild(tempDiv);

      // Convert HTML to canvas with better settings
      const canvas = await html2canvas.default(tempDiv, {
        scale: 1.5, // Reduced scale for better performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF with proper dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Check if content fits on one page
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight <= pageHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Multiple pages
        let heightLeft = pdfHeight;
        let position = 0;
        let page = 1;

        while (heightLeft >= pageHeight) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;

          if (heightLeft >= pageHeight) {
            pdf.addPage();
            page++;
          }
        }

        // Add remaining content
        if (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        }
      }

      // Generate filename with contract number if available
      const contractNumber =
        offer.originalContractNumber ||
        `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
          Math.random() * 9999
        )
          .toString()
          .padStart(4, '0')}`;
      const filename = `Lease_Agreement_${contractNumber}.pdf`;

      // Download the PDF
      pdf.save(filename);

      console.log('✅ Contract PDF downloaded successfully:', filename);
      return true;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      // Fallback: download as HTML file
      const contractNumber =
        offer.originalContractNumber ||
        `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(
          Math.random() * 9999
        )
          .toString()
          .padStart(4, '0')}`;
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lease_Agreement_${contractNumber}.html`;
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
