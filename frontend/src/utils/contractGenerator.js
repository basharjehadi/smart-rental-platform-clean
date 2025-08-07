// Contract Generator Utility
export const generateRentalContract = async (offer, user = null) => {
  // Get tenant signature from offer data
  let tenantSignature = offer.tenant?.signatureBase64 || null;
  
  // Get landlord signature from offer data
  let landlordSignature = offer.landlord?.signatureBase64 || null;
  
  // Clean up signature data - remove data URL prefix if present
  if (tenantSignature && tenantSignature.startsWith('data:image/')) {
    tenantSignature = tenantSignature.split(',')[1];
  }
  
  if (landlordSignature && landlordSignature.startsWith('data:image/')) {
    landlordSignature = landlordSignature.split(',')[1];
  }
  
  // Debug logging to see what we have
  console.log('🔍 Signature Debug in generateRentalContract:');
  console.log('Offer tenant signature:', offer.tenant?.signatureBase64 ? 'Present' : 'Missing');
  console.log('Offer landlord signature:', offer.landlord?.signatureBase64 ? 'Present' : 'Missing');
  console.log('Tenant signature length:', offer.tenant?.signatureBase64?.length || 0);
  console.log('Landlord signature length:', offer.landlord?.signatureBase64?.length || 0);

  // Get payment date from offer or use current date as fallback
  const paymentDate = offer.paymentDate ? new Date(offer.paymentDate) : new Date();
  const contractDate = paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const contractTime = paymentDate.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Calculate lease dates
  const leaseStartDate = offer.availableFrom ? new Date(offer.availableFrom) : new Date();
  const leaseEndDate = new Date(leaseStartDate);
  leaseEndDate.setMonth(leaseEndDate.getMonth() + offer.leaseDuration);
  
  // Generate payment schedule
  const generatePaymentSchedule = () => {
    const schedule = [];
    const startDate = new Date(leaseStartDate);
    
    // Start from second month since first month + deposit is already paid
    for (let i = 1; i < offer.leaseDuration; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setDate(10); // Always 10th of the month
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      schedule.push({
        number: i, // Payment number (starting from 2nd month)
        dueDate: paymentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        amount: offer.rentAmount
      });
    }
    return schedule;
  };

  const paymentSchedule = generatePaymentSchedule();

  const contractData = {
    contractNumber: `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    date: contractDate,
    time: contractTime,
    paymentTimestamp: paymentDate.toISOString(),
    
    // Tenant information - use actual data from offer.tenant (provided by backend)
    tenantName: offer.tenant?.name || 'Tenant',
    tenantEmail: offer.tenant?.email || 'tenant@email.com',
    tenantPESEL: offer.tenant?.pesel || null,
    tenantPassport: offer.tenant?.passportNumber || null,
    tenantResidenceCard: offer.tenant?.kartaPobytuNumber || null,
    tenantPhone: offer.tenant?.phoneNumber || '+48123456789',
    tenantAddress: offer.tenant?.address || offer.tenant?.street || 'Tenant Address',
    tenantCity: offer.tenant?.city || 'City',
    tenantZipCode: offer.tenant?.zipCode || '00-000',
    tenantCountry: offer.tenant?.country || 'Poland',
    
    // Landlord information - use actual data from offer.landlord
    landlordName: offer.landlord?.name || 'Landlord',
    landlordEmail: offer.landlord?.email || 'landlord@email.com',
    landlordPESEL: offer.landlord?.pesel || 'EG55568',
    landlordPhone: offer.landlord?.phoneNumber || offer.landlord?.phone || '+48987654321',
    landlordAddress: offer.landlord?.address || offer.landlord?.street || 'Landlord Address',
    landlordCity: offer.landlord?.city || 'City',
    landlordZipCode: offer.landlord?.zipCode || '00-000',
    landlordCountry: offer.landlord?.country || 'Poland',
    
    // Property information
    propertyAddress: offer.propertyAddress || offer.property?.address || 'Property Address',
    propertyType: offer.propertyType || offer.property?.propertyType || 'Apartment',
    bedrooms: offer.property?.bedrooms || 2,
    rentAmount: offer.rentAmount || 0,
    depositAmount: offer.depositAmount || offer.rentAmount || 0,
    // Calculate prorated first month for contract display
    proratedFirstMonth: (() => {
      if (!offer.availableFrom || !offer.rentAmount) return 0;
      const moveInDate = new Date(offer.availableFrom);
      const daysInMonth = new Date(moveInDate.getFullYear(), moveInDate.getMonth() + 1, 0).getDate();
      const daysFromMoveIn = daysInMonth - moveInDate.getDate() + 1;
      return Math.round((offer.rentAmount * daysFromMoveIn) / daysInMonth);
    })(),
    leaseDuration: offer.leaseDuration || 12,
    availableFrom: leaseStartDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    availableFromPolish: leaseStartDate.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    leaseEndDate: leaseEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    leaseEndDatePolish: leaseEndDate.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    utilitiesIncluded: offer.utilitiesIncluded || 'included in rent amount',
    utilitiesIncludedPolish: offer.utilitiesIncluded || 'wliczone w czynsz',
    description: offer.description || 'Standard rental terms apply',
    paymentSchedule: paymentSchedule,
    // Include signatures if available
    tenantSignature: tenantSignature,
    landlordSignature: landlordSignature
  };

  // Debug logging
  console.log('Contract Data Debug:', {
    tenantSignature: tenantSignature ? 'Present' : 'Missing',
    landlordSignature: landlordSignature ? 'Present' : 'Missing',
    offerLandlord: offer.landlord ? 'Present' : 'Missing',
    user: user ? 'Present' : 'Missing'
  });
  
  console.log('Landlord & Tenant Data Debug:', {
    landlordName: offer.landlord?.name,
    landlordEmail: offer.landlord?.email,
    landlordPhone: offer.landlord?.phoneNumber,
    tenantName: offer.tenant?.name,
    tenantEmail: offer.tenant?.email,
    tenantAddress: offer.tenant?.address,
    tenantCity: offer.tenant?.city,
    propertyAddress: offer.propertyAddress || offer.property?.address,
    propertyType: offer.propertyType || offer.property?.propertyType
  });
  
  console.log('Final signature data:');
  console.log('Tenant signature (first 50 chars):', tenantSignature ? tenantSignature.substring(0, 50) + '...' : 'null');
  console.log('Landlord signature (first 50 chars):', landlordSignature ? landlordSignature.substring(0, 50) + '...' : 'null');

  return contractData;
};

export const viewContract = async (offer, user = null) => {
  try {
    // Generate the contract HTML directly
    const contractData = await generateRentalContract(offer, user);
    
    // Additional debugging for viewContract
    console.log('ViewContract Debug:', {
      offerLandlord: offer.landlord,
      offerLandlordSignature: offer.landlord?.signatureBase64,
      contractDataLandlordSignature: contractData.landlordSignature,
      contractDataTenantSignature: contractData.tenantSignature,
      user: user
    });
    
    // Create a professional bilingual HTML contract template with A4 format and page numbering
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
            font-size: 13pt; 
            font-weight: bold; 
            margin-bottom: 18pt;
            text-transform: uppercase;
            border-bottom: 1.5pt solid #000;
            padding-bottom: 8pt;
            letter-spacing: 0.5pt;
          }
          
          .two-column { 
            display: table; 
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15pt;
          }
          
          .english-column, .polish-column { 
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 12pt;
          }
          
          .english-column { 
            border-right: 1pt solid #000;
            padding-right: 18pt;
          }
          
          .polish-column {
            border-left: 1pt solid #000;
            padding-left: 18pt;
          }
          
          .party-info { 
            margin-bottom: 20pt; 
          }
          
          .party-title { 
            font-weight: bold; 
            margin-bottom: 10pt;
            font-size: 12pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            border-bottom: 0.5pt solid #000;
            padding-bottom: 3pt;
          }
          
          .party-details { 
            margin-left: 18pt; 
          }
          
          .party-detail { 
            margin-bottom: 6pt; 
            line-height: 1.4;
            font-size: 11pt;
          }
          
          .clause { 
            margin-bottom: 15pt; 
            padding: 0;
            position: relative;
          }
          
          .clause-letter { 
            font-weight: bold; 
            color: #000;
            margin-bottom: 6pt;
            display: block;
            font-size: 11pt;
          }
          
          .payment-info {
            background: #f8f8f8;
            border: 2pt solid #000;
            padding: 20pt;
            margin: 25pt 0;
            border-radius: 3pt;
          }
          
          .payment-info h4 {
            color: #000;
            margin-bottom: 15pt;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12pt;
            letter-spacing: 0.5pt;
            border-bottom: 1pt solid #000;
            padding-bottom: 5pt;
          }
          
          .payment-detail {
            margin-bottom: 8pt;
            font-size: 11pt;
            line-height: 1.4;
          }
          
          .payment-schedule {
            margin: 20pt 0;
            border: 1pt solid #000;
            border-collapse: collapse;
            width: 100%;
          }
          
          .payment-schedule th,
          .payment-schedule td {
            border: 1pt solid #000;
            padding: 8pt;
            text-align: center;
            font-size: 10pt;
          }
          
          .payment-schedule th {
            background: #f0f0f0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
          }
          
          .signature-section { 
            margin-top: 50pt; 
            page-break-inside: avoid;
          }
          
          .signature-boxes-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 30pt;
            margin-top: 30pt;
          }
          
          .signature-box { 
            flex: 1;
            padding: 30pt 25pt;
            border: 2pt solid #000;
            background: white;
            border-radius: 3pt;
            min-width: 0;
            width: 45%;
          }
          
          .signature-title { 
            font-weight: bold; 
            margin-bottom: 20pt;
            text-transform: uppercase;
            color: #000;
            font-size: 11pt;
            text-align: center;
            letter-spacing: 0.5pt;
            border-bottom: 1pt solid #000;
            padding-bottom: 8pt;
          }
          
          .signature-line { 
            border-top: 1pt solid #000; 
            margin: 25pt 0 15pt 0; 
          }
          
          .signature-name { 
            font-weight: bold; 
            margin-bottom: 6pt;
            color: #000;
            font-size: 11pt;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
          }
          
          .signature-date { 
            font-style: italic; 
            color: #333;
            font-size: 10pt;
            text-align: center;
          }
          
          .signature-image { 
            max-width: 250pt; 
            max-height: 150pt; 
            margin: 20pt 0; 
            border: none !important; 
            border-radius: 0 !important;
            padding: 0 !important; 
            background: transparent !important; 
            box-shadow: none !important;
            filter: contrast(1.4) brightness(0.6) saturate(0.6) sepia(0.4);
            mix-blend-mode: multiply;
            opacity: 0.85;
            transform: rotate(-2deg) scale(0.95);
            display: block;
            margin-left: auto;
            margin-right: auto;
            image-rendering: auto;
            -webkit-image-smoothing: auto;
            -moz-image-smoothing: auto;
            image-smoothing: auto;
            object-fit: contain;
            width: auto;
            height: auto;
          }
          
          .signature-placeholder { 
            color: #666; 
            font-style: italic; 
            padding: 25pt; 
            border: 1pt dashed #999; 
            text-align: center;
            background: #f9f9f9; 
            margin: 20pt 0;
            font-size: 10pt;
          }
          
          .footer { 
            margin-top: 40pt; 
            text-align: center; 
            color: #333; 
            font-size: 9pt; 
            border-top: 1pt solid #ccc;
            padding-top: 20pt;
            line-height: 1.4;
          }
          
          .status-badge {
            display: inline-block;
            background: #000;
            color: white;
            padding: 4pt 10pt;
            font-size: 10pt;
            font-weight: bold;
            margin-left: 12pt;
            border-radius: 2pt;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
          }
          
          .document-info {
            position: absolute;
            top: 20mm;
            right: 20mm;
            font-size: 8pt;
            color: #666;
            text-align: right;
            line-height: 1.3;
          }
          
          @media print {
            body {
              width: 210mm;
              height: 297mm;
            }
            .page {
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="document-info">
            <div>Document Type: Lease Agreement</div>
            <div>Generated: ${contractData.date}</div>
            <div>Time: ${contractData.time}</div>
          </div>
          
          <div class="header">
            <div class="main-title">Lease Agreement</div>
            <div class="sub-title">Umowa najmu</div>
            <div class="contract-number">Contract No.: ${contractData.contractNumber}</div>
          </div>

          <div class="section">
            <div class="section-title">Parties Involved / Strony umowy</div>
            <div class="two-column">
              <div class="english-column">
                <div class="party-info">
                  <div class="party-title">1/ LANDLORD:</div>
                  <div class="party-details">
                    <div class="party-detail">Name: ${contractData.landlordName}</div>
                    <div class="party-detail">Address: ${contractData.landlordAddress}, ${contractData.landlordCity}, ${contractData.landlordZipCode}, ${contractData.landlordCountry}</div>
                    <div class="party-detail">PESEL: ${contractData.landlordPESEL}</div>
                    <div class="party-detail">Phone: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ TENANT:</div>
                  <div class="party-details">
                    <div class="party-detail">Name: ${contractData.tenantName}</div>
                    <div class="party-detail">Address: ${contractData.tenantAddress}, ${contractData.tenantCity}, ${contractData.tenantZipCode}, ${contractData.tenantCountry}</div>
                    ${contractData.tenantPESEL ? `<div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>` : ''}
                    ${contractData.tenantPassport ? `<div class="party-detail">Passport: ${contractData.tenantPassport}</div>` : ''}
                    ${contractData.tenantResidenceCard ? `<div class="party-detail">Residence Card: ${contractData.tenantResidenceCard}</div>` : ''}
                    <div class="party-detail">Phone: ${contractData.tenantPhone}</div>
                  </div>
                </div>
              </div>
              <div class="polish-column">
                <div class="party-info">
                  <div class="party-title">1/ WYNAJMUJĄCY:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.landlordName}</div>
                    <div class="party-detail">Adres: ${contractData.landlordAddress}, ${contractData.landlordCity}, ${contractData.landlordZipCode}, ${contractData.landlordCountry}</div>
                    <div class="party-detail">PESEL: ${contractData.landlordPESEL}</div>
                    <div class="party-detail">Telefon: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ NAJEMCA:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.tenantName}</div>
                    <div class="party-detail">Adres: ${contractData.tenantAddress}, ${contractData.tenantCity}, ${contractData.tenantZipCode}, ${contractData.tenantCountry}</div>
                    ${contractData.tenantPESEL ? `<div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>` : ''}
                    ${contractData.tenantPassport ? `<div class="party-detail">Paszport: ${contractData.tenantPassport}</div>` : ''}
                    ${contractData.tenantResidenceCard ? `<div class="party-detail">Karta pobytu: ${contractData.tenantResidenceCard}</div>` : ''}
                    <div class="party-detail">Telefon: ${contractData.tenantPhone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§1. SUBJECT OF THE AGREEMENT / PRZEDMIOT UMOWY</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The Landlord declares that he/she is the owner of the real estate property located at: ${contractData.propertyAddress}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The Tenant declares that he/she is familiar with the location and technical condition of the property and accepts it in its current state.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The Landlord rents the property to the Tenant, and the Tenant rents from the Landlord, for residential purposes.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Wynajmujący oświadcza, że jest właścicielem nieruchomości położonej przy: ${contractData.propertyAddress}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Najemca oświadcza, że zna lokalizację i stan techniczny nieruchomości i przyjmuje ją w stanie obecnym.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Wynajmujący wynajmuje nieruchomość Najemcy, a Najemca wynajmuje od Wynajmującego, w celach mieszkalnych.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§2. LEASE TERM / OKRES NAJMU</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The lease term is ${contractData.leaseDuration} months, starting from ${contractData.availableFrom} and ending on ${contractData.leaseEndDate}.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The agreement may be extended by mutual written consent of both parties.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.availableFromPolish} i kończąc się ${contractData.leaseEndDatePolish}.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Umowa może zostać przedłużona za obopólną pisemną zgodą obu stron.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§3. RENT AND DEPOSIT / CZYNSZ I KAUCJA</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The monthly rent is ${contractData.rentAmount} PLN, payable by the 10th day of each month.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The security deposit is ${contractData.depositAmount} PLN, which has been paid upon signing this agreement.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Initial payment breakdown:
                  <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>• First month (prorated for ${contractData.availableFrom}): ${contractData.proratedFirstMonth} PLN</li>
                    <li>• Security deposit: ${contractData.depositAmount} PLN</li>
                    <li>• Total initial payment: ${contractData.proratedFirstMonth + contractData.depositAmount} PLN</li>
                  </ul>
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> The tenant agrees to pay the monthly rent by the 10th of each month.
                </div>
                <div class="clause">
                  <span class="clause-letter">e)</span> Utilities are ${contractData.utilitiesIncluded}.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Miesięczny czynsz wynosi ${contractData.rentAmount} PLN, płatny do 10. dnia każdego miesiąca.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Kaucja wynosi ${contractData.depositAmount} PLN, która została zapłacona przy podpisaniu niniejszej umowy.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Szczegóły płatności początkowej:
                  <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>• Pierwszy miesiąc (proporcjonalnie od ${contractData.availableFromPolish}): ${contractData.proratedFirstMonth} PLN</li>
                    <li>• Kaucja: ${contractData.depositAmount} PLN</li>
                    <li>• Łączna płatność początkowa: ${contractData.proratedFirstMonth + contractData.depositAmount} PLN</li>
                  </ul>
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> Najemca zgadza się płacić miesięczny czynsz do 10. dnia każdego miesiąca.
                </div>
                <div class="clause">
                  <span class="clause-letter">e)</span> Media są ${contractData.utilitiesIncludedPolish}.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§4. PAYMENT SCHEDULE / HARMONOGRAM PŁATNOŚCI</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Payment Schedule for ${contractData.leaseDuration} months:
                </div>
                <table class="payment-schedule">
                  <thead>
                    <tr>
                      <th>Payment No.</th>
                      <th>Due Date</th>
                      <th>Amount (PLN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contractData.paymentSchedule.map(payment => `
                      <tr>
                        <td>${payment.number}</td>
                        <td>${payment.dueDate}</td>
                        <td>${payment.amount}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Harmonogram płatności na ${contractData.leaseDuration} miesięcy:
                </div>
                <table class="payment-schedule">
                  <thead>
                    <tr>
                      <th>Nr płatności</th>
                      <th>Termin płatności</th>
                      <th>Kwota (PLN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contractData.paymentSchedule.map(payment => `
                      <tr>
                        <td>${payment.number}</td>
                        <td>${payment.dueDate}</td>
                        <td>${payment.amount}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§5. REFUND POLICY / POLITYKA ZWROTU</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The tenant has the right to request a full refund within 24 hours after check-in if the property does not match the description or if there are significant issues not disclosed in the agreement.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The refund request must be submitted in writing with photographic evidence of the issues.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The landlord will process the refund within 5 business days of receiving a valid refund request.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Najemca ma prawo do żądania pełnego zwrotu w ciągu 24 godzin po zameldowaniu, jeśli nieruchomość nie odpowiada opisowi lub występują istotne problemy nieujawnione w umowie.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Wniosek o zwrot musi być złożony na piśmie z dowodami fotograficznymi problemów.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Wynajmujący przetworzy zwrot w ciągu 5 dni roboczych od otrzymania ważnego wniosku o zwrot.
                </div>
              </div>
            </div>
          </div>

          <div class="signature-section">
            <div class="section-title">§6. SIGNATURES / PODPISY</div>
            <div class="signature-boxes-container">
              <div class="signature-box">
                <div class="signature-title">Landlord Signature / Podpis Wynajmującego</div>
                ${contractData.landlordSignature ? 
                  `<img src="data:image/png;base64,${contractData.landlordSignature}" alt="Landlord Signature" class="signature-image">` : 
                  '<div class="signature-placeholder">Digital signature not available</div>'
                }
                <div class="signature-line"></div>
                <div class="signature-name">${contractData.landlordName}</div>
                <div class="signature-date">Date: ${contractData.date}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Tenant Signature / Podpis Najemcy</div>
                ${contractData.tenantSignature ? 
                  `<img src="data:image/png;base64,${contractData.tenantSignature}" alt="Tenant Signature" class="signature-image">` : 
                  '<div class="signature-placeholder">Digital signature not available</div>'
                }
                <div class="signature-line"></div>
                <div class="signature-name">${contractData.tenantName}</div>
                <div class="signature-date">Date: ${contractData.date}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>This document was generated by Smart Rental System on ${contractData.date}</div>
            <div>Contract ID: ${contractData.contractNumber} | Generated: ${contractData.date}</div>
            <div>This is a legally binding document. Please keep a copy for your records.</div>
            <div>To jest dokument prawnie wiążący. Prosimy zachować kopię do celów dokumentacyjnych.</div>
          </div>
          
          <div class="page-number">Page 1</div>
        </div>
      </body>
      </html>
    `;

    // Open the contract in a new window
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
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
    // Generate the contract HTML directly (same as viewContract)
    const contractData = await generateRentalContract(offer, user);
    
    // Create the same HTML template as viewContract with A4 format and page numbering
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
            font-size: 13pt; 
            font-weight: bold; 
            margin-bottom: 18pt;
            text-transform: uppercase;
            border-bottom: 1.5pt solid #000;
            padding-bottom: 8pt;
            letter-spacing: 0.5pt;
          }
          
          .two-column { 
            display: table; 
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15pt;
          }
          
          .english-column, .polish-column { 
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 12pt;
          }
          
          .english-column { 
            border-right: 1pt solid #000;
            padding-right: 18pt;
          }
          
          .polish-column {
            border-left: 1pt solid #000;
            padding-left: 18pt;
          }
          
          .party-info { 
            margin-bottom: 20pt; 
          }
          
          .party-title { 
            font-weight: bold; 
            margin-bottom: 10pt;
            font-size: 12pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            border-bottom: 0.5pt solid #000;
            padding-bottom: 3pt;
          }
          
          .party-details { 
            margin-left: 18pt; 
          }
          
          .party-detail { 
            margin-bottom: 6pt; 
            line-height: 1.4;
            font-size: 11pt;
          }
          
          .clause { 
            margin-bottom: 15pt; 
            padding: 0;
            position: relative;
          }
          
          .clause-letter { 
            font-weight: bold; 
            color: #000;
            margin-bottom: 6pt;
            display: block;
            font-size: 11pt;
          }
          
          .payment-info {
            background: #f8f8f8;
            border: 2pt solid #000;
            padding: 20pt;
            margin: 25pt 0;
            border-radius: 3pt;
          }
          
          .payment-info h4 {
            color: #000;
            margin-bottom: 15pt;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12pt;
            letter-spacing: 0.5pt;
            border-bottom: 1pt solid #000;
            padding-bottom: 5pt;
          }
          
          .payment-detail {
            margin-bottom: 8pt;
            font-size: 11pt;
            line-height: 1.4;
          }
          
          .payment-schedule {
            margin: 20pt 0;
            border: 1pt solid #000;
            border-collapse: collapse;
            width: 100%;
          }
          
          .payment-schedule th,
          .payment-schedule td {
            border: 1pt solid #000;
            padding: 8pt;
            text-align: center;
            font-size: 10pt;
          }
          
          .payment-schedule th {
            background: #f0f0f0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
          }
          
          .signature-section { 
            margin-top: 50pt; 
            page-break-inside: avoid;
          }
          
          .signature-boxes-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 30pt;
            margin-top: 30pt;
          }
          
          .signature-box { 
            flex: 1;
            padding: 30pt 25pt;
            border: 2pt solid #000;
            background: white;
            border-radius: 3pt;
            min-width: 0;
            width: 45%;
          }
          
          .signature-title { 
            font-weight: bold; 
            margin-bottom: 20pt;
            text-transform: uppercase;
            color: #000;
            font-size: 11pt;
            text-align: center;
            letter-spacing: 0.5pt;
            border-bottom: 1pt solid #000;
            padding-bottom: 8pt;
          }
          
          .signature-line { 
            border-top: 1pt solid #000; 
            margin: 25pt 0 15pt 0; 
          }
          
          .signature-name { 
            font-weight: bold; 
            margin-bottom: 6pt;
            color: #000;
            font-size: 11pt;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
          }
          
          .signature-date { 
            font-style: italic; 
            color: #333;
            font-size: 10pt;
            text-align: center;
          }
          
          .signature-image { 
            max-width: 250pt; 
            max-height: 150pt; 
            margin: 20pt 0; 
            border: none !important; 
            border-radius: 0 !important;
            padding: 0 !important; 
            background: transparent !important; 
            box-shadow: none !important;
            filter: contrast(1.4) brightness(0.6) saturate(0.6) sepia(0.4);
            mix-blend-mode: multiply;
            opacity: 0.85;
            transform: rotate(-2deg) scale(0.95);
            display: block;
            margin-left: auto;
            margin-right: auto;
            image-rendering: auto;
            -webkit-image-smoothing: auto;
            -moz-image-smoothing: auto;
            image-smoothing: auto;
            object-fit: contain;
            width: auto;
            height: auto;
          }
          
          .signature-placeholder { 
            color: #666; 
            font-style: italic; 
            padding: 25pt; 
            border: 1pt dashed #999; 
            text-align: center;
            background: #f9f9f9; 
            margin: 20pt 0;
            font-size: 10pt;
          }
          
          .footer { 
            margin-top: 40pt; 
            text-align: center; 
            color: #333; 
            font-size: 9pt; 
            border-top: 1pt solid #ccc;
            padding-top: 20pt;
            line-height: 1.4;
          }
          
          .status-badge {
            display: inline-block;
            background: #000;
            color: white;
            padding: 4pt 10pt;
            font-size: 10pt;
            font-weight: bold;
            margin-left: 12pt;
            border-radius: 2pt;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
          }
          
          .document-info {
            position: absolute;
            top: 20mm;
            right: 20mm;
            font-size: 8pt;
            color: #666;
            text-align: right;
            line-height: 1.3;
          }
          
          @media print {
            body {
              width: 210mm;
              height: 297mm;
            }
            .page {
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="document-info">
            <div>Document Type: Lease Agreement</div>
            <div>Generated: ${contractData.date}</div>
            <div>Time: ${contractData.time}</div>
          </div>
          
          <div class="header">
            <div class="main-title">Lease Agreement</div>
            <div class="sub-title">Umowa najmu</div>
            <div class="contract-number">Contract No.: ${contractData.contractNumber}</div>
          </div>

          <div class="section">
            <div class="section-title">Parties Involved / Strony umowy</div>
            <div class="two-column">
              <div class="english-column">
                <div class="party-info">
                  <div class="party-title">1/ LANDLORD:</div>
                  <div class="party-details">
                    <div class="party-detail">Name: ${contractData.landlordName}</div>
                    <div class="party-detail">Address: ${contractData.landlordAddress}, ${contractData.landlordCity}, ${contractData.landlordZipCode}, ${contractData.landlordCountry}</div>
                    <div class="party-detail">PESEL: ${contractData.landlordPESEL}</div>
                    <div class="party-detail">Phone: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ TENANT:</div>
                  <div class="party-details">
                    <div class="party-detail">Name: ${contractData.tenantName}</div>
                    <div class="party-detail">Address: ${contractData.tenantAddress}, ${contractData.tenantCity}, ${contractData.tenantZipCode}, ${contractData.tenantCountry}</div>
                    ${contractData.tenantPESEL ? `<div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>` : ''}
                    ${contractData.tenantPassport ? `<div class="party-detail">Passport: ${contractData.tenantPassport}</div>` : ''}
                    ${contractData.tenantResidenceCard ? `<div class="party-detail">Residence Card: ${contractData.tenantResidenceCard}</div>` : ''}
                    <div class="party-detail">Phone: ${contractData.tenantPhone}</div>
                  </div>
                </div>
              </div>
              <div class="polish-column">
                <div class="party-info">
                  <div class="party-title">1/ WYNAJMUJĄCY:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.landlordName}</div>
                    <div class="party-detail">Adres: ${contractData.landlordAddress}, ${contractData.landlordCity}, ${contractData.landlordZipCode}, ${contractData.landlordCountry}</div>
                    <div class="party-detail">Nr dowodu osobistego: ${contractData.landlordPESEL}</div>
                    <div class="party-detail">Telefon: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ NAJEMCA:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.tenantName}</div>
                    <div class="party-detail">Adres: ${contractData.tenantAddress}, ${contractData.tenantCity}, ${contractData.tenantZipCode}, ${contractData.tenantCountry}</div>
                    ${contractData.tenantPESEL ? `<div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>` : ''}
                    ${contractData.tenantPassport ? `<div class="party-detail">Paszport: ${contractData.tenantPassport}</div>` : ''}
                    ${contractData.tenantResidenceCard ? `<div class="party-detail">Karta pobytu: ${contractData.tenantResidenceCard}</div>` : ''}
                    <div class="party-detail">Telefon: ${contractData.tenantPhone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§1. SUBJECT OF THE AGREEMENT / PRZEDMIOT UMOWY</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The Landlord declares that he/she is the owner of the real estate property located at: ${contractData.propertyAddress}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The Tenant declares that he/she is familiar with the location and technical condition of the property and accepts it in its current state.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The Landlord rents the property to the Tenant, and the Tenant rents from the Landlord, for residential purposes.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Wynajmujący oświadcza, że jest właścicielem nieruchomości położonej przy: ${contractData.propertyAddress}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Najemca oświadcza, że zna lokalizację i stan techniczny nieruchomości i przyjmuje ją w stanie obecnym.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Wynajmujący wynajmuje nieruchomość Najemcy, a Najemca wynajmuje od Wynajmującego, w celach mieszkalnych.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§2. LEASE TERM / OKRES NAJMU</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The lease term is ${contractData.leaseDuration} months, starting from ${contractData.availableFrom} and ending on ${contractData.leaseEndDate}.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The agreement may be extended by mutual written consent of both parties.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.availableFromPolish} i kończąc się ${contractData.leaseEndDatePolish}.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Umowa może zostać przedłużona za obopólną pisemną zgodą obu stron.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§3. RENT AND DEPOSIT / CZYNSZ I KAUCJA</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The monthly rent is ${contractData.rentAmount} PLN, payable by the 10th day of each month.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The security deposit is ${contractData.depositAmount} PLN, which has been paid upon signing this agreement.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Initial payment breakdown:
                  <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>• First month (prorated for ${contractData.availableFrom}): ${contractData.proratedFirstMonth} PLN</li>
                    <li>• Security deposit: ${contractData.depositAmount} PLN</li>
                    <li>• Total initial payment: ${contractData.proratedFirstMonth + contractData.depositAmount} PLN</li>
                  </ul>
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> The tenant agrees to pay the monthly rent by the 10th of each month.
                </div>
                <div class="clause">
                  <span class="clause-letter">e)</span> Utilities are ${contractData.utilitiesIncluded}.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Miesięczny czynsz wynosi ${contractData.rentAmount} PLN, płatny do 10. dnia każdego miesiąca.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Kaucja wynosi ${contractData.depositAmount} PLN, która została zapłacona przy podpisaniu niniejszej umowy.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Szczegóły płatności początkowej:
                  <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>• Pierwszy miesiąc (proporcjonalnie od ${contractData.availableFromPolish}): ${contractData.proratedFirstMonth} PLN</li>
                    <li>• Kaucja: ${contractData.depositAmount} PLN</li>
                    <li>• Łączna płatność początkowa: ${contractData.proratedFirstMonth + contractData.depositAmount} PLN</li>
                  </ul>
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> Najemca zgadza się płacić miesięczny czynsz do 10. dnia każdego miesiąca.
                </div>
                <div class="clause">
                  <span class="clause-letter">e)</span> Media są ${contractData.utilitiesIncludedPolish}.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§4. PAYMENT SCHEDULE / HARMONOGRAM PŁATNOŚCI</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Payment Schedule for ${contractData.leaseDuration} months:
                </div>
                <table class="payment-schedule">
                  <thead>
                    <tr>
                      <th>Payment No.</th>
                      <th>Due Date</th>
                      <th>Amount (PLN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contractData.paymentSchedule.map(payment => `
                      <tr>
                        <td>${payment.number}</td>
                        <td>${payment.dueDate}</td>
                        <td>${payment.amount}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Harmonogram płatności na ${contractData.leaseDuration} miesięcy:
                </div>
                <table class="payment-schedule">
                  <thead>
                    <tr>
                      <th>Nr płatności</th>
                      <th>Termin płatności</th>
                      <th>Kwota (PLN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contractData.paymentSchedule.map(payment => `
                      <tr>
                        <td>${payment.number}</td>
                        <td>${payment.dueDate}</td>
                        <td>${payment.amount}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§5. REFUND POLICY / POLITYKA ZWROTU</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The tenant has the right to request a full refund within 24 hours after check-in if the property does not match the description or if there are significant issues not disclosed in the agreement.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The refund request must be submitted in writing with photographic evidence of the issues.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The landlord will process the refund within 5 business days of receiving a valid refund request.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Najemca ma prawo do żądania pełnego zwrotu w ciągu 24 godzin po zameldowaniu, jeśli nieruchomość nie odpowiada opisowi lub występują istotne problemy nieujawnione w umowie.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Wniosek o zwrot musi być złożony na piśmie z dowodami fotograficznymi problemów.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Wynajmujący przetworzy zwrot w ciągu 5 dni roboczych od otrzymania ważnego wniosku o zwrot.
                </div>
              </div>
            </div>
          </div>

          <div class="signature-section">
            <div class="section-title">§6. SIGNATURES / PODPISY</div>
            <div class="signature-boxes-container">
              <div class="signature-box">
                <div class="signature-title">Landlord Signature / Podpis Wynajmującego</div>
                ${contractData.landlordSignature ? 
                  `<img src="data:image/png;base64,${contractData.landlordSignature}" alt="Landlord Signature" class="signature-image">` : 
                  '<div class="signature-placeholder">Digital signature not available</div>'
                }
                <div class="signature-line"></div>
                <div class="signature-name">${contractData.landlordName}</div>
                <div class="signature-date">Date: ${contractData.date}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Tenant Signature / Podpis Najemcy</div>
                ${contractData.tenantSignature ? 
                  `<img src="data:image/png;base64,${contractData.tenantSignature}" alt="Tenant Signature" class="signature-image">` : 
                  '<div class="signature-placeholder">Digital signature not available</div>'
                }
                <div class="signature-line"></div>
                <div class="signature-name">${contractData.tenantName}</div>
                <div class="signature-date">Date: ${contractData.date}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>This document was generated by Smart Rental System on ${contractData.date}</div>
            <div>Contract ID: ${contractData.contractNumber} | Generated: ${contractData.date}</div>
            <div>This is a legally binding document. Please keep a copy for your records.</div>
            <div>To jest dokument prawnie wiążący. Prosimy zachować kopię do celów dokumentacyjnych.</div>
          </div>
          
          <div class="page-number">Page 1</div>
        </div>
      </body>
      </html>
    `;

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
      pdf.save(`Lease_Agreement_${contractData.contractNumber}.pdf`);
      
      console.log('✅ Contract PDF downloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      // Fallback: download as HTML file
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lease_Agreement_${contractData.contractNumber}.html`;
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

export const generateReceipt = (offer) => {
  const receiptData = {
    receiptNumber: `RCP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: new Date().toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    tenantName: offer.tenant?.name || 'Tenant',
    landlordName: offer.landlord?.name || 'Landlord',
    propertyAddress: offer.propertyAddress || 'Property Address',
    rentAmount: offer.rentAmount || 0,
    depositAmount: offer.depositAmount || offer.rentAmount || 0,
    totalAmount: (offer.rentAmount || 0) + (offer.depositAmount || offer.rentAmount || 0)
  };

  return receiptData;
};

export const downloadReceipt = async (offer) => {
  try {
    const receiptData = generateReceipt(offer);
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt - ${receiptData.receiptNumber}</title>
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 40px; 
            line-height: 1.7; 
            color: #1f2937;
            font-size: 14px;
            background: #f9fafb;
            max-width: 800px;
            margin: 0 auto;
          }
          .receipt-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 40px;
            margin: 20px 0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
          }
          .main-title { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px;
            color: #1f2937;
          }
          .receipt-number { 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 25px;
            color: #374151;
            background: #f3f4f6;
            padding: 12px 20px;
            border-radius: 8px;
            display: inline-block;
          }
          .payment-details {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .payment-details h4 {
            color: #0369a1;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          .detail-value {
            color: #6b7280;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #3b82f6;
            font-weight: 700;
            font-size: 18px;
            color: #1f2937;
          }
          .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
            padding-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="main-title">Payment Receipt / Potwierdzenie płatności</div>
            <div class="receipt-number">Receipt No.: ${receiptData.receiptNumber}</div>
          </div>

          <div class="payment-details">
            <h4>Payment Information / Informacje o płatności</h4>
            <div class="detail-row">
              <span class="detail-label">Date / Data:</span>
              <span class="detail-value">${receiptData.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time / Godzina:</span>
              <span class="detail-value">${receiptData.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tenant / Najemca:</span>
              <span class="detail-value">${receiptData.tenantName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Landlord / Wynajmujący:</span>
              <span class="detail-value">${receiptData.landlordName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Property / Nieruchomość:</span>
              <span class="detail-value">${receiptData.propertyAddress}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rent Amount / Kwota czynszu:</span>
              <span class="detail-value">${receiptData.rentAmount} PLN</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Deposit Amount / Kwota kaucji:</span>
              <span class="detail-value">${receiptData.depositAmount} PLN</span>
            </div>
            <div class="total-row">
              <span class="detail-label">Total Amount / Kwota całkowita:</span>
              <span class="detail-value">${receiptData.totalAmount} PLN <span class="status-badge">PAID</span></span>
            </div>
          </div>

          <div class="footer">
            <div>This receipt was generated by Smart Rental System on ${receiptData.date}</div>
            <div>Receipt ID: ${receiptData.receiptNumber} | Generated: ${receiptData.date}</div>
            <div>Please keep this receipt for your records.</div>
            <div>Prosimy zachować to potwierdzenie do celów dokumentacyjnych.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to PDF using jsPDF and html2canvas
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = receiptHTML;
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
      pdf.save(`Payment_Receipt_${receiptData.receiptNumber}.pdf`);
      
      console.log('✅ Receipt PDF downloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      // Fallback: download as HTML file
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payment_Receipt_${receiptData.receiptNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Receipt HTML downloaded as fallback');
      return true;
    }
  } catch (error) {
    console.error('❌ Error downloading receipt:', error);
    throw new Error('Error downloading receipt. Please try again.');
  }
};

