// Contract Generator Utility
export const generateRentalContract = async (offer, user = null) => {
  // Get tenant signature from user context if available
  let tenantSignature = offer.tenant?.signatureBase64 || null;
  
  // If no signature in offer and user is provided, try to get from user context
  if (!tenantSignature && user) {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        tenantSignature = userData.signatureBase64 || null;
      }
    } catch (error) {
      console.error('Error fetching user signature:', error);
    }
  }

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

  const contractData = {
    contractNumber: `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    date: contractDate,
    time: contractTime,
    paymentTimestamp: paymentDate.toISOString(),
    tenantName: offer.tenant?.name || 'Tenant',
    tenantEmail: offer.tenant?.email || 'tenant@email.com',
    tenantPESEL: offer.tenant?.pesel || '97103010959',
    tenantPassport: offer.tenant?.passport || 'BH0603147',
    tenantResidenceCard: offer.tenant?.residenceCard || 'EG005784',
    tenantPhone: offer.tenant?.phone || '+48123456789',
    landlordName: offer.landlord?.name || 'Landlord',
    landlordEmail: offer.landlord?.email || 'landlord@email.com',
    landlordIDCard: offer.landlord?.idCard || 'EG55568',
    landlordPhone: offer.landlord?.phone || '+48987654321',
    propertyAddress: offer.propertyAddress || 'Property Address',
    propertyType: offer.propertyType || 'Apartment',
    bedrooms: offer.property?.bedrooms || 2,
    rentAmount: offer.rentAmount || 0,
    depositAmount: offer.depositAmount || offer.rentAmount || 0,
    leaseDuration: offer.leaseDuration || 12,
    availableFrom: offer.availableFrom ? new Date(offer.availableFrom).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'TBD',
    utilitiesIncluded: offer.utilitiesIncluded || 'Not specified',
    description: offer.description || 'Standard rental terms apply',
      // Include signatures if available
    tenantSignature: tenantSignature,
    landlordSignature: offer.landlord?.signatureBase64 || null
  };

  // Debug logging
  console.log('Contract Data Debug:', {
    tenantSignature: tenantSignature ? 'Present' : 'Missing',
    landlordSignature: offer.landlord?.signatureBase64 ? 'Present' : 'Missing',
    offerLandlord: offer.landlord ? 'Present' : 'Missing',
    user: user ? 'Present' : 'Missing'
  });

  return contractData;
};

export const generateContractPDF = async (offer, user = null) => {
  const contractData = await generateRentalContract(offer, user);
  
  // Create a professional bilingual HTML contract template
  const contractHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Lease Agreement - ${contractData.contractNumber}</title>
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 40px; 
          line-height: 1.7; 
          color: #1f2937;
          font-size: 14px;
          background: #f9fafb;
          max-width: 1200px;
          margin: 0 auto;
        }
        .contract-container {
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
          letter-spacing: -0.025em;
        }
        .sub-title { 
          font-size: 20px; 
          margin-bottom: 15px;
          color: #6b7280;
          font-weight: 500;
        }
        .contract-number { 
          font-size: 16px; 
          font-weight: 600; 
          margin-bottom: 25px;
          color: #374151;
          background: #f3f4f6;
          padding: 12px 20px;
          border-radius: 8px;
          display: inline-block;
        }
        .section { 
          margin-bottom: 30px; 
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 25px;
          background: #fafafa;
        }
        .section-title { 
          font-size: 18px; 
          font-weight: 600; 
          text-align: center;
          margin-bottom: 20px;
          color: #1f2937;
          padding-bottom: 10px;
          border-bottom: 1px solid #d1d5db;
        }
        .two-column { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 30px; 
        }
        .english-column, .polish-column { 
          padding: 20px; 
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .english-column { 
          border-right: 2px solid #3b82f6; 
        }
        .polish-column {
          border-left: 2px solid #3b82f6;
        }
        .party-info { 
          margin-bottom: 20px; 
        }
        .party-title { 
          font-weight: 600; 
          margin-bottom: 8px;
          color: #1f2937;
          font-size: 16px;
        }
        .party-details { 
          margin-left: 20px; 
        }
        .party-detail { 
          margin-bottom: 6px; 
          color: #4b5563;
        }
        .signature-section { 
          margin-top: 50px; 
          text-align: center;
        }
        .signature-box { 
          display: inline-block; 
          width: 45%; 
          margin: 0 2.5%; 
          vertical-align: top;
        }
        .signature-title { 
          font-weight: bold; 
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .signature-line { 
          border-top: 1px solid #333; 
          margin: 20px 0 10px 0; 
        }
        .signature-name { 
          font-weight: bold; 
          margin-bottom: 5px;
        }
        .signature-date { 
          font-style: italic; 
        }
        .signature-image { 
          max-width: 200px; 
          max-height: 100px; 
          margin: 15px 0; 
          border: 2px solid #e5e7eb; 
          border-radius: 8px;
          padding: 10px; 
          background: white; 
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .signature-placeholder { 
          color: #9ca3af; 
          font-style: italic; 
          padding: 30px; 
          border: 2px dashed #d1d5db; 
          border-radius: 8px;
          background: #f9fafb; 
          margin: 15px 0;
        }
        .footer { 
          margin-top: 50px; 
          text-align: center; 
          color: #6b7280; 
          font-size: 14px; 
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
        }
        .clause { 
          margin-bottom: 15px; 
          padding: 15px;
          background: white;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        .clause-letter { 
          font-weight: 600; 
          color: #1f2937;
          margin-bottom: 8px;
          display: block;
        }
        .payment-info {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .payment-info h4 {
          color: #0369a1;
          margin-bottom: 10px;
          font-weight: 600;
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
      </style>
    </head>
    <body>
      <div class="contract-container">
        <div class="header">
          <div class="main-title">Lease Agreement / Umowa najmu</div>
          <div class="sub-title">Rental Contract / Kontrakt najmu</div>
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
                <div class="party-detail">Address: Poznan, Poland</div>
                <div class="party-detail">ID Card: ${contractData.landlordIDCard}</div>
                <div class="party-detail">Phone: ${contractData.landlordPhone}</div>
              </div>
            </div>
            <div class="party-info">
              <div class="party-title">2/ TENANT:</div>
              <div class="party-details">
                <div class="party-detail">Name: ${contractData.tenantName}</div>
                <div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>
                <div class="party-detail">Passport: ${contractData.tenantPassport}</div>
                <div class="party-detail">Residence Card: ${contractData.tenantResidenceCard}</div>
                <div class="party-detail">Phone: ${contractData.tenantPhone}</div>
              </div>
            </div>
          </div>
          <div class="polish-column">
            <div class="party-info">
              <div class="party-title">1/ WYNAJMUJĄCY:</div>
              <div class="party-details">
                <div class="party-detail">Imię i nazwisko: ${contractData.landlordName}</div>
                <div class="party-detail">Adres: Poznan, Poland</div>
                <div class="party-detail">Nr dowodu osobistego: ${contractData.landlordIDCard}</div>
                <div class="party-detail">Telefon: ${contractData.landlordPhone}</div>
              </div>
            </div>
            <div class="party-info">
              <div class="party-title">2/ NAJEMCA:</div>
              <div class="party-details">
                <div class="party-detail">Imię i nazwisko: ${contractData.tenantName}</div>
                <div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>
                <div class="party-detail">Paszport: ${contractData.tenantPassport}</div>
                <div class="party-detail">Karta pobytu: ${contractData.tenantResidenceCard}</div>
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
              <span class="clause-letter">a)</span> The lease term is ${contractData.leaseDuration} months, starting from ${contractData.availableFrom} and ending on ${new Date(new Date(contractData.availableFrom).getTime() + (contractData.leaseDuration * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> The agreement may be extended by mutual written consent of both parties.
            </div>
          </div>
          <div class="polish-column">
            <div class="clause">
              <span class="clause-letter">a)</span> Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.availableFrom} i kończąc się ${new Date(new Date(contractData.availableFrom).getTime() + (contractData.leaseDuration * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}.
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
              <span class="clause-letter">a)</span> Monthly rent: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.rentAmount)}
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Security deposit: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.depositAmount)}
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> Rent is due on the 1st day of each month.
            </div>
            <div class="clause">
              <span class="clause-letter">d)</span> Late payment fee: 50 PLN if rent is not received within 5 days of due date.
            </div>
          </div>
          <div class="polish-column">
            <div class="clause">
              <span class="clause-letter">a)</span> Miesięczny czynsz: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.rentAmount)}
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Kaucja: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.depositAmount)}
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> Czynsz płatny do 1-go dnia każdego miesiąca.
            </div>
            <div class="clause">
              <span class="clause-letter">d)</span> Opłata za zwłokę: 50 PLN jeśli czynsz nie zostanie otrzymany w ciągu 5 dni od terminu płatności.
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">§4. UTILITIES AND SERVICES / MEDIA I USŁUGI</div>
        <div class="two-column">
          <div class="english-column">
            <div class="clause">
              Utilities and services (electricity, water, gas, internet, etc.) are the responsibility of the Tenant unless otherwise specified in writing by the Landlord.
            </div>
          </div>
          <div class="polish-column">
            <div class="clause">
              Media i usługi (prąd, woda, gaz, internet, itp.) są odpowiedzialnością Najemcy, chyba że Wynajmujący nie określi inaczej na piśmie.
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">§5. MAINTENANCE AND REPAIRS / KONSERWACJA I NAPRAWY</div>
        <div class="two-column">
          <div class="english-column">
            <div class="clause">
              <span class="clause-letter">a)</span> The Landlord is responsible for major repairs and structural maintenance.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> The Tenant is responsible for minor repairs and general upkeep.
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> The Tenant must report any damages or necessary repairs to the Landlord immediately.
            </div>
          </div>
          <div class="polish-column">
            <div class="clause">
              <span class="clause-letter">a)</span> Wynajmujący odpowiada za poważne naprawy i konserwację strukturalną.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Najemca odpowiada za drobne naprawy i ogólną konserwację.
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> Najemca musi natychmiast zgłaszać wszelkie szkody lub niezbędne naprawy Wynajmującemu.
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">§6. TERMINATION / ROZWIĄZANIE UMOWY</div>
        <div class="two-column">
          <div class="english-column">
            <div class="clause">
              <span class="clause-letter">a)</span> Either party may terminate this agreement with 30 days written notice.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Early termination may result in forfeiture of security deposit.
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> The Tenant must return the property in the same condition as received, normal wear and tear excepted.
            </div>
          </div>
          <div class="polish-column">
            <div class="clause">
              <span class="clause-letter">a)</span> Każda ze stron może rozwiązać umowę z 30-dniowym pisemnym wypowiedzeniem.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Przedwczesne rozwiązanie może skutkować utratą kaucji.
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> Najemca musi zwrócić nieruchomość w tym samym stanie, w jakim ją otrzymał, z wyjątkiem normalnego zużycia.
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">§7. ADDITIONAL PROVISIONS / POSTANOWIENIA DODATKOWE</div>
        <div class="two-column">
          <div class="english-column">
            <div class="clause">
              <span class="clause-letter">a)</span> This agreement is subject to all applicable local, state, and federal laws.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Any disputes arising from this agreement shall be resolved through mediation or legal proceedings as permitted by law.
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> This agreement constitutes the entire understanding between the parties.
            </div>
          </div>
          <div class="polish-column">
            <div class="clause">
              <span class="clause-letter">a)</span> Niniejsza umowa podlega wszystkim obowiązującym przepisom lokalnym, stanowym i federalnym.
            </div>
            <div class="clause">
              <span class="clause-letter">b)</span> Wszelkie spory wynikające z tej umowy będą rozwiązywane poprzez mediację lub postępowanie prawne zgodnie z prawem.
            </div>
            <div class="clause">
              <span class="clause-letter">c)</span> Niniejsza umowa stanowi pełne porozumienie między stronami.
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Info -->
      <div style="background: #fef3c7; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
        <strong>Debug Info:</strong><br>
        Landlord Signature: ${contractData.landlordSignature ? 'Present' : 'Missing'}<br>
        Tenant Signature: ${contractData.tenantSignature ? 'Present' : 'Missing'}<br>
        Landlord Name: ${contractData.landlordName}<br>
        Tenant Name: ${contractData.tenantName}
      </div>

      <div class="signature-section">
        <div class="section-title">§8. SIGNATURES / PODPISY</div>
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

      <div class="footer">
        <div>This document was generated by Smart Rental System on ${contractData.date}</div>
        <div>Contract ID: ${contractData.contractNumber} | Generated: ${contractData.date}</div>
        <div>This is a legally binding document. Please keep a copy for your records.</div>
        <div>To jest dokument prawnie wiążący. Prosimy zachować kopię do celów dokumentacyjnych.</div>
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
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback: return the HTML content
    return contractHTML;
  }
};

export const downloadContract = async (offer, user = null) => {
  try {
    // Generate the contract HTML directly (same as viewContract)
    const contractData = await generateRentalContract(offer, user);
    
    // Create the same HTML template as viewContract
    const contractHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lease Agreement - ${contractData.contractNumber}</title>
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 40px; 
            line-height: 1.7; 
            color: #1f2937;
            font-size: 14px;
            background: #f9fafb;
            max-width: 1200px;
            margin: 0 auto;
          }
          .contract-container {
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
            letter-spacing: -0.025em;
          }
          .sub-title { 
            font-size: 20px; 
            margin-bottom: 15px;
            color: #6b7280;
            font-weight: 500;
          }
          .contract-number { 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 25px;
            color: #374151;
            background: #f3f4f6;
            padding: 12px 20px;
            border-radius: 8px;
            display: inline-block;
          }
          .section { 
            margin-bottom: 30px; 
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 25px;
            background: #fafafa;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: 600; 
            text-align: center;
            margin-bottom: 20px;
            color: #1f2937;
            padding-bottom: 10px;
            border-bottom: 1px solid #d1d5db;
          }
          .two-column { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
          }
          .english-column, .polish-column { 
            padding: 20px; 
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .english-column { 
            border-right: 2px solid #3b82f6; 
          }
          .polish-column {
            border-left: 2px solid #3b82f6;
          }
          .party-info { 
            margin-bottom: 20px; 
          }
          .party-title { 
            font-weight: 600; 
            margin-bottom: 8px;
            color: #1f2937;
            font-size: 16px;
          }
          .party-details { 
            margin-left: 20px; 
          }
          .party-detail { 
            margin-bottom: 6px; 
            color: #4b5563;
          }
          .signature-section { 
            margin-top: 50px; 
            text-align: center;
          }
          .signature-box { 
            display: inline-block; 
            width: 45%; 
            margin: 0 2.5%; 
            vertical-align: top;
          }
          .signature-title { 
            font-weight: bold; 
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .signature-line { 
            border-top: 1px solid #333; 
            margin: 20px 0 10px 0; 
          }
          .signature-name { 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .signature-date { 
            font-style: italic; 
          }
          .signature-image { 
            max-width: 200px; 
            max-height: 100px; 
            margin: 15px 0; 
            border: 2px solid #e5e7eb; 
            border-radius: 8px;
            padding: 10px; 
            background: white; 
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .signature-placeholder { 
            color: #9ca3af; 
            font-style: italic; 
            padding: 30px; 
            border: 2px dashed #d1d5db; 
            border-radius: 8px;
            background: #f9fafb; 
            margin: 15px 0;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
            padding-top: 30px;
          }
          .clause { 
            margin-bottom: 15px; 
            padding: 15px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
          }
          .clause-letter { 
            font-weight: 600; 
            color: #1f2937;
            margin-bottom: 8px;
            display: block;
          }
          .payment-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .payment-info h4 {
            color: #0369a1;
            margin-bottom: 10px;
            font-weight: 600;
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
        </style>
      </head>
      <body>
        <div class="contract-container">
          <div class="header">
            <div class="main-title">Lease Agreement / Umowa najmu</div>
            <div class="sub-title">Rental Contract / Kontrakt najmu</div>
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
                    <div class="party-detail">Address: Poznan, Poland</div>
                    <div class="party-detail">ID Card: ${contractData.landlordIDCard}</div>
                    <div class="party-detail">Phone: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ TENANT:</div>
                  <div class="party-details">
                    <div class="party-detail">Name: ${contractData.tenantName}</div>
                    <div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>
                    <div class="party-detail">Passport: ${contractData.tenantPassport}</div>
                    <div class="party-detail">Residence Card: ${contractData.tenantResidenceCard}</div>
                    <div class="party-detail">Phone: ${contractData.tenantPhone}</div>
                  </div>
                </div>
              </div>
              <div class="polish-column">
                <div class="party-info">
                  <div class="party-title">1/ WYNAJMUJĄCY:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.landlordName}</div>
                    <div class="party-detail">Adres: Poznan, Poland</div>
                    <div class="party-detail">Nr dowodu osobistego: ${contractData.landlordIDCard}</div>
                    <div class="party-detail">Telefon: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ NAJEMCA:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.tenantName}</div>
                    <div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>
                    <div class="party-detail">Paszport: ${contractData.tenantPassport}</div>
                    <div class="party-detail">Karta pobytu: ${contractData.tenantResidenceCard}</div>
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
                  <span class="clause-letter">a)</span> The lease term is ${contractData.leaseDuration} months, starting from ${contractData.availableFrom} and ending on ${new Date(new Date(contractData.availableFrom).getTime() + (contractData.leaseDuration * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The agreement may be extended by mutual written consent of both parties.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.availableFrom} i kończąc się ${new Date(new Date(contractData.availableFrom).getTime() + (contractData.leaseDuration * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}.
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
                  <span class="clause-letter">a)</span> Monthly rent: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.rentAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Security deposit: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.depositAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Rent is due on the 1st day of each month.
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> Late payment fee: 50 PLN if rent is not received within 5 days of due date.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Miesięczny czynsz: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.rentAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Kaucja: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.depositAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Czynsz płatny do 1-go dnia każdego miesiąca.
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> Opłata za zwłokę: 50 PLN jeśli czynsz nie zostanie otrzymany w ciągu 5 dni od terminu płatności.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§4. UTILITIES AND SERVICES / MEDIA I USŁUGI</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  Utilities and services (electricity, water, gas, internet, etc.) are the responsibility of the Tenant unless otherwise specified in writing by the Landlord.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  Media i usługi (prąd, woda, gaz, internet, itp.) są odpowiedzialnością Najemcy, chyba że Wynajmujący nie określi inaczej na piśmie.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§5. MAINTENANCE AND REPAIRS / KONSERWACJA I NAPRAWY</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The Landlord is responsible for major repairs and structural maintenance.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The Tenant is responsible for minor repairs and general upkeep.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The Tenant must report any damages or necessary repairs to the Landlord immediately.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Wynajmujący odpowiada za poważne naprawy i konserwację strukturalną.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Najemca odpowiada za drobne naprawy i ogólną konserwację.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Najemca musi natychmiast zgłaszać wszelkie szkody lub niezbędne naprawy Wynajmującemu.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§6. TERMINATION / ROZWIĄZANIE UMOWY</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Either party may terminate this agreement with 30 days written notice.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Early termination may result in forfeiture of security deposit.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The Tenant must return the property in the same condition as received, normal wear and tear excepted.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Każda ze stron może rozwiązać umowę z 30-dniowym pisemnym wypowiedzeniem.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Przedwczesne rozwiązanie może skutkować utratą kaucji.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Najemca musi zwrócić nieruchomość w tym samym stanie, w jakim ją otrzymał, z wyjątkiem normalnego zużycia.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§7. ADDITIONAL PROVISIONS / POSTANOWIENIA DODATKOWE</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> This agreement is subject to all applicable local, state, and federal laws.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Any disputes arising from this agreement shall be resolved through mediation or legal proceedings as permitted by law.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> This agreement constitutes the entire understanding between the parties.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Niniejsza umowa podlega wszystkim obowiązującym przepisom lokalnym, stanowym i federalnym.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Wszelkie spory wynikające z tej umowy będą rozwiązywane poprzez mediację lub postępowanie prawne zgodnie z prawem.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Niniejsza umowa stanowi pełne porozumienie między stronami.
                </div>
              </div>
            </div>
          </div>

          <!-- Debug Info -->
          <div style="background: #fef3c7; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
            <strong>Debug Info:</strong><br>
            Landlord Signature: ${contractData.landlordSignature ? 'Present' : 'Missing'}<br>
            Tenant Signature: ${contractData.tenantSignature ? 'Present' : 'Missing'}<br>
            Landlord Name: ${contractData.landlordName}<br>
            Tenant Name: ${contractData.tenantName}
          </div>

          <div class="signature-section">
            <div class="section-title">§8. SIGNATURES / PODPISY</div>
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

          <div class="footer">
            <div>This document was generated by Smart Rental System on ${contractData.date}</div>
            <div>Contract ID: ${contractData.contractNumber} | Generated: ${contractData.date}</div>
            <div>This is a legally binding document. Please keep a copy for your records.</div>
            <div>To jest dokument prawnie wiążący. Prosimy zachować kopię do celów dokumentacyjnych.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and download the contract as HTML file
    const blob = new Blob([contractHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rental-contract-${contractData.contractNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading contract:', error);
    alert('Error generating contract. Please try again.');
  }
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
    
    // Create a professional bilingual HTML contract template
    const contractHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lease Agreement - ${contractData.contractNumber}</title>
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 40px; 
            line-height: 1.7; 
            color: #1f2937;
            font-size: 14px;
            background: #f9fafb;
            max-width: 1200px;
            margin: 0 auto;
          }
          .contract-container {
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
            letter-spacing: -0.025em;
          }
          .sub-title { 
            font-size: 20px; 
            margin-bottom: 15px;
            color: #6b7280;
            font-weight: 500;
          }
          .contract-number { 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 25px;
            color: #374151;
            background: #f3f4f6;
            padding: 12px 20px;
            border-radius: 8px;
            display: inline-block;
          }
          .section { 
            margin-bottom: 30px; 
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 25px;
            background: #fafafa;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: 600; 
            text-align: center;
            margin-bottom: 20px;
            color: #1f2937;
            padding-bottom: 10px;
            border-bottom: 1px solid #d1d5db;
          }
          .two-column { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
          }
          .english-column, .polish-column { 
            padding: 20px; 
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .english-column { 
            border-right: 2px solid #3b82f6; 
          }
          .polish-column {
            border-left: 2px solid #3b82f6;
          }
          .party-info { 
            margin-bottom: 20px; 
          }
          .party-title { 
            font-weight: 600; 
            margin-bottom: 8px;
            color: #1f2937;
            font-size: 16px;
          }
          .party-details { 
            margin-left: 20px; 
          }
          .party-detail { 
            margin-bottom: 6px; 
            color: #4b5563;
          }
          .signature-section { 
            margin-top: 50px; 
            text-align: center;
          }
          .signature-box { 
            display: inline-block; 
            width: 45%; 
            margin: 0 2.5%; 
            vertical-align: top;
          }
          .signature-title { 
            font-weight: bold; 
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .signature-line { 
            border-top: 1px solid #333; 
            margin: 20px 0 10px 0; 
          }
          .signature-name { 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .signature-date { 
            font-style: italic; 
          }
          .signature-image { 
            max-width: 200px; 
            max-height: 100px; 
            margin: 15px 0; 
            border: 2px solid #e5e7eb; 
            border-radius: 8px;
            padding: 10px; 
            background: white; 
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .signature-placeholder { 
            color: #9ca3af; 
            font-style: italic; 
            padding: 30px; 
            border: 2px dashed #d1d5db; 
            border-radius: 8px;
            background: #f9fafb; 
            margin: 15px 0;
          }
          .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
            padding-top: 30px;
          }
          .clause { 
            margin-bottom: 15px; 
            padding: 15px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
          }
          .clause-letter { 
            font-weight: 600; 
            color: #1f2937;
            margin-bottom: 8px;
            display: block;
          }
          .payment-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .payment-info h4 {
            color: #0369a1;
            margin-bottom: 10px;
            font-weight: 600;
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
        </style>
      </head>
      <body>
        <div class="contract-container">
          <div class="header">
            <div class="main-title">Lease Agreement / Umowa najmu</div>
            <div class="sub-title">Rental Contract / Kontrakt najmu</div>
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
                    <div class="party-detail">Address: Poznan, Poland</div>
                    <div class="party-detail">ID Card: ${contractData.landlordIDCard}</div>
                    <div class="party-detail">Phone: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ TENANT:</div>
                  <div class="party-details">
                    <div class="party-detail">Name: ${contractData.tenantName}</div>
                    <div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>
                    <div class="party-detail">Passport: ${contractData.tenantPassport}</div>
                    <div class="party-detail">Residence Card: ${contractData.tenantResidenceCard}</div>
                    <div class="party-detail">Phone: ${contractData.tenantPhone}</div>
                  </div>
                </div>
              </div>
              <div class="polish-column">
                <div class="party-info">
                  <div class="party-title">1/ WYNAJMUJĄCY:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.landlordName}</div>
                    <div class="party-detail">Adres: Poznan, Poland</div>
                    <div class="party-detail">Nr dowodu osobistego: ${contractData.landlordIDCard}</div>
                    <div class="party-detail">Telefon: ${contractData.landlordPhone}</div>
                  </div>
                </div>
                <div class="party-info">
                  <div class="party-title">2/ NAJEMCA:</div>
                  <div class="party-details">
                    <div class="party-detail">Imię i nazwisko: ${contractData.tenantName}</div>
                    <div class="party-detail">PESEL: ${contractData.tenantPESEL}</div>
                    <div class="party-detail">Paszport: ${contractData.tenantPassport}</div>
                    <div class="party-detail">Karta pobytu: ${contractData.tenantResidenceCard}</div>
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
                  <span class="clause-letter">a)</span> The lease term is ${contractData.leaseDuration} months, starting from ${contractData.availableFrom} and ending on ${new Date(new Date(contractData.availableFrom).getTime() + (contractData.leaseDuration * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The agreement may be extended by mutual written consent of both parties.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Okres najmu wynosi ${contractData.leaseDuration} miesięcy, rozpoczynając się od ${contractData.availableFrom} i kończąc się ${new Date(new Date(contractData.availableFrom).getTime() + (contractData.leaseDuration * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}.
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
                  <span class="clause-letter">a)</span> Monthly rent: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.rentAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Security deposit: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.depositAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Rent is due on the 1st day of each month.
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> Late payment fee: 50 PLN if rent is not received within 5 days of due date.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Miesięczny czynsz: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.rentAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Kaucja: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(contractData.depositAmount)}
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Czynsz płatny do 1-go dnia każdego miesiąca.
                </div>
                <div class="clause">
                  <span class="clause-letter">d)</span> Opłata za zwłokę: 50 PLN jeśli czynsz nie zostanie otrzymany w ciągu 5 dni od terminu płatności.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§4. UTILITIES AND SERVICES / MEDIA I USŁUGI</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  Utilities and services (electricity, water, gas, internet, etc.) are the responsibility of the Tenant unless otherwise specified in writing by the Landlord.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  Media i usługi (prąd, woda, gaz, internet, itp.) są odpowiedzialnością Najemcy, chyba że Wynajmujący nie określi inaczej na piśmie.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§5. MAINTENANCE AND REPAIRS / KONSERWACJA I NAPRAWY</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> The Landlord is responsible for major repairs and structural maintenance.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> The Tenant is responsible for minor repairs and general upkeep.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The Tenant must report any damages or necessary repairs to the Landlord immediately.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Wynajmujący odpowiada za poważne naprawy i konserwację strukturalną.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Najemca odpowiada za drobne naprawy i ogólną konserwację.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Najemca musi natychmiast zgłaszać wszelkie szkody lub niezbędne naprawy Wynajmującemu.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§6. TERMINATION / ROZWIĄZANIE UMOWY</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Either party may terminate this agreement with 30 days written notice.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Early termination may result in forfeiture of security deposit.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> The Tenant must return the property in the same condition as received, normal wear and tear excepted.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Każda ze stron może rozwiązać umowę z 30-dniowym pisemnym wypowiedzeniem.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Przedwczesne rozwiązanie może skutkować utratą kaucji.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Najemca musi zwrócić nieruchomość w tym samym stanie, w jakim ją otrzymał, z wyjątkiem normalnego zużycia.
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">§7. ADDITIONAL PROVISIONS / POSTANOWIENIA DODATKOWE</div>
            <div class="two-column">
              <div class="english-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> This agreement is subject to all applicable local, state, and federal laws.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Any disputes arising from this agreement shall be resolved through mediation or legal proceedings as permitted by law.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> This agreement constitutes the entire understanding between the parties.
                </div>
              </div>
              <div class="polish-column">
                <div class="clause">
                  <span class="clause-letter">a)</span> Niniejsza umowa podlega wszystkim obowiązującym przepisom lokalnym, stanowym i federalnym.
                </div>
                <div class="clause">
                  <span class="clause-letter">b)</span> Wszelkie spory wynikające z tej umowy będą rozwiązywane poprzez mediację lub postępowanie prawne zgodnie z prawem.
                </div>
                <div class="clause">
                  <span class="clause-letter">c)</span> Niniejsza umowa stanowi pełne porozumienie między stronami.
                </div>
              </div>
            </div>
          </div>

          <!-- Debug Info -->
          <div style="background: #fef3c7; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
            <strong>Debug Info:</strong><br>
            Landlord Signature: ${contractData.landlordSignature ? 'Present' : 'Missing'}<br>
            Tenant Signature: ${contractData.tenantSignature ? 'Present' : 'Missing'}<br>
            Landlord Name: ${contractData.landlordName}<br>
            Tenant Name: ${contractData.tenantName}
          </div>

          <div class="signature-section">
            <div class="section-title">§8. SIGNATURES / PODPISY</div>
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

          <div class="footer">
            <div>This document was generated by Smart Rental System on ${contractData.date}</div>
            <div>Contract ID: ${contractData.contractNumber} | Generated: ${contractData.date}</div>
            <div>This is a legally binding document. Please keep a copy for your records.</div>
            <div>To jest dokument prawnie wiążący. Prosimy zachować kopię do celów dokumentacyjnych.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open the contract in a new window
    const newWindow = window.open('', '_blank');
    newWindow.document.write(contractHTML);
    newWindow.document.title = `Rental Contract - ${contractData.contractNumber}`;
    newWindow.document.close();
    
  } catch (error) {
    console.error('Error viewing contract:', error);
    alert('Error generating contract. Please try again.');
  }
};

export const generateReceipt = (offer) => {
  const receiptData = {
    receiptNumber: `REC-${Date.now()}`,
    date: new Date().toLocaleDateString('pl-PL'),
    time: new Date().toLocaleTimeString('pl-PL'),
    tenantName: offer.tenant?.name || 'Tenant',
    landlordName: offer.landlord?.name || 'Landlord',
    propertyAddress: offer.propertyAddress || 'Property Address',
    rentAmount: offer.rentAmount || 0,
    depositAmount: offer.depositAmount || offer.rentAmount || 0,
    serviceFee: Math.round((offer.rentAmount || 0) * 0.03), // 3% service fee
    totalAmount: (offer.rentAmount || 0) + (offer.depositAmount || offer.rentAmount || 0) + Math.round((offer.rentAmount || 0) * 0.03)
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
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
          .info-item { padding: 10px; background: #f9fafb; border-radius: 5px; }
          .info-label { font-weight: bold; color: #374151; }
          .info-value { color: #111827; }
          .payment-breakdown { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .total { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYMENT RECEIPT</h1>
          <p><strong>Receipt Number:</strong> ${receiptData.receiptNumber}</p>
          <p><strong>Date:</strong> ${receiptData.date} at ${receiptData.time}</p>
        </div>

        <div class="section">
          <h3>PAYMENT DETAILS</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Tenant:</div>
              <div class="info-value">${receiptData.tenantName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Landlord:</div>
              <div class="info-value">${receiptData.landlordName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Property:</div>
              <div class="info-value">${receiptData.propertyAddress}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Status:</div>
              <div class="info-value">✅ PAID (Escrow Protected)</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>PAYMENT BREAKDOWN</h3>
          <div class="payment-breakdown">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>First Month's Rent:</span>
              <span>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(receiptData.rentAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Security Deposit:</span>
              <span>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(receiptData.depositAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Service Fee (3%):</span>
              <span>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(receiptData.serviceFee)}</span>
            </div>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #d1d5db;">
            <div class="total">
              <div style="display: flex; justify-content: space-between;">
                <span>TOTAL PAID:</span>
                <span>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(receiptData.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>ESCROW PROTECTION</h3>
          <p>✅ Your payment has been secured in our escrow system and will be released to the landlord 24 hours after successful check-in.</p>
          <p>🛡️ You are protected by our 24-hour guarantee. If the property doesn't match the description, you can request a full refund.</p>
        </div>

        <div class="footer">
          <p>This receipt is generated by Smart Rental System</p>
          <p>For questions, contact our support team</p>
        </div>
      </body>
      </html>
    `;

    // Create and download the receipt
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-receipt-${receiptData.receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading receipt:', error);
    alert('Error generating receipt. Please try again.');
  }
};
