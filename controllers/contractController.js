import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkContractEligibility = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    // Find the rental request and related offer
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(rentalRequestId) },
      include: {
        offer: {
          include: {
            rentPayments: {
              where: {
                status: 'SUCCEEDED'
              }
            }
          }
        }
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is authorized
    if (rentalRequest.tenantId !== userId && rentalRequest.offer?.landlordId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this contract' });
    }

    // Check if offer exists and is accepted
    if (!rentalRequest.offer || rentalRequest.offer.status !== 'ACCEPTED') {
      return res.status(400).json({ 
        error: 'No accepted offer found for this rental request',
        canGenerate: false,
        reason: 'No accepted offer'
      });
    }

    // Check if deposit and first month rent are paid
    const paidPayments = rentalRequest.offer.rentPayments;
    const hasDepositPayment = paidPayments.some(payment => 
      payment.purpose === 'DEPOSIT' && payment.status === 'SUCCEEDED'
    );
    const hasFirstMonthPayment = paidPayments.some(payment => 
      payment.purpose === 'RENT' && payment.status === 'SUCCEEDED'
    );

    const canGenerate = hasDepositPayment && hasFirstMonthPayment;
    const reason = canGenerate ? 'Payment completed' : 'Deposit and first month rent payment required';

    res.json({
      canGenerate,
      reason,
      hasDepositPayment,
      hasFirstMonthPayment,
      contractGenerated: rentalRequest.offer.contractGenerated || false
    });

  } catch (error) {
    console.error('Error checking contract eligibility:', error);
    res.status(500).json({ error: 'Failed to check contract eligibility' });
  }
};

export const generateContract = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    // Find the rental request and related offer with enhanced data
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: parseInt(rentalRequestId) },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            pesel: true,
            passportNumber: true,
            kartaPobytuNumber: true,
            phoneNumber: true,
            signatureBase64: true
          }
        },
        offer: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                dowodOsobistyNumber: true,
                phoneNumber: true,
                address: true,
                signatureBase64: true
              }
            },
            rentPayments: {
              where: {
                status: 'SUCCEEDED'
              }
            }
          }
        },
        contractSignature: true
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is authorized to view this contract
    if (rentalRequest.tenantId !== userId && rentalRequest.offer?.landlordId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this contract' });
    }

    // Check if offer exists and is accepted
    if (!rentalRequest.offer || rentalRequest.offer.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'No accepted offer found for this rental request' });
    }

    // Check if deposit and first month rent are paid
    const paidPayments = rentalRequest.offer.rentPayments;
    const hasDepositPayment = paidPayments.some(payment => 
      payment.purpose === 'DEPOSIT' && payment.status === 'SUCCEEDED'
    );
    const hasFirstMonthPayment = paidPayments.some(payment => 
      payment.purpose === 'RENT' && payment.status === 'SUCCEEDED'
    );

    if (!hasDepositPayment || !hasFirstMonthPayment) {
      return res.status(400).json({ 
        error: 'Contract can only be generated after deposit and first month rent payment',
        hasDepositPayment,
        hasFirstMonthPayment
      });
    }

    // Generate contract HTML with enhanced data
    const contractHtml = generateContractHTML(rentalRequest);

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDF(contractHtml);

    // Mark contract as generated if not already
    if (!rentalRequest.offer.contractGenerated) {
      await prisma.offer.update({
        where: { id: rentalRequest.offer.id },
        data: {
          contractGenerated: true,
          contractGeneratedAt: new Date()
        }
      });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rental-contract-${rentalRequestId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
};

const generateContractHTML = (rentalRequest) => {
  const { tenant, offer, contractSignature } = rentalRequest;
  const landlord = offer.landlord;
  
  // Format dates
  const leaseStartDate = offer.leaseStartDate ? new Date(offer.leaseStartDate).toLocaleDateString() : 'TBD';
  const leaseEndDate = offer.leaseEndDate ? new Date(offer.leaseEndDate).toLocaleDateString() : 'TBD';
  const currentDate = new Date().toLocaleDateString();
  const signedDate = contractSignature?.signedAt ? new Date(contractSignature.signedAt).toLocaleDateString() : currentDate;

  // Get full names
  const tenantFullName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.name;
  const landlordFullName = `${landlord.firstName || ''} ${landlord.lastName || ''}`.trim() || landlord.name;

  // Identity information
  const tenantIdentity = [
    tenant.pesel && `PESEL: ${tenant.pesel}`,
    tenant.passportNumber && `Passport: ${tenant.passportNumber}`,
    tenant.kartaPobytuNumber && `Residence Card: ${tenant.kartaPobytuNumber}`,
    tenant.phoneNumber && `Phone: ${tenant.phoneNumber}`
  ].filter(Boolean).join(', ');

  const landlordIdentity = [
    landlord.dowodOsobistyNumber && `ID Card: ${landlord.dowodOsobistyNumber}`,
    landlord.phoneNumber && `Phone: ${landlord.phoneNumber}`,
    landlord.address && `Address: ${landlord.address}`
  ].filter(Boolean).join(', ');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rental Agreement</title>
        <style>
            body {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                margin: 40px;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 18px;
                color: #666;
            }
            .section {
                margin-bottom: 25px;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                border-bottom: 1px solid #ccc;
                padding-bottom: 5px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                margin-bottom: 10px;
            }
            .info-label {
                font-weight: bold;
                color: #555;
            }
            .identity-info {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
            .signature-section {
                margin-top: 50px;
                page-break-inside: avoid;
            }
            .signature-line {
                border-top: 1px solid #333;
                margin-top: 30px;
                padding-top: 5px;
                text-align: center;
            }
            .signature-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 30px;
            }
            .signature-box {
                border: 1px solid #ccc;
                padding: 20px;
                text-align: center;
                min-height: 150px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .signature-image {
                max-width: 200px;
                max-height: 80px;
                margin: 10px auto;
            }
            .terms {
                margin-top: 30px;
                font-size: 12px;
                line-height: 1.4;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 10px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">RENTAL AGREEMENT</div>
            <div class="subtitle">Smart Rental System</div>
            <div>Contract Date: ${currentDate}</div>
        </div>

        <div class="section">
            <div class="section-title">1. PARTIES TO THE AGREEMENT</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Landlord:</div>
                    <div>${landlordFullName}</div>
                    <div>Email: ${landlord.email}</div>
                    ${landlordIdentity ? `<div class="identity-info">${landlordIdentity}</div>` : ''}
                </div>
                <div class="info-item">
                    <div class="info-label">Tenant:</div>
                    <div>${tenantFullName}</div>
                    <div>Email: ${tenant.email}</div>
                    ${tenantIdentity ? `<div class="identity-info">${tenantIdentity}</div>` : ''}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">2. PROPERTY DETAILS</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Property Location:</div>
                    <div>${rentalRequest.location}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Property Type:</div>
                    <div>Rental Unit</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">3. LEASE TERMS</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Monthly Rent:</div>
                    <div>$${offer.rentAmount.toFixed(2)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Security Deposit:</div>
                    <div>$${offer.depositAmount ? offer.depositAmount.toFixed(2) : '0.00'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Lease Start Date:</div>
                    <div>${leaseStartDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Lease End Date:</div>
                    <div>${leaseEndDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Lease Duration:</div>
                    <div>${offer.leaseDuration} months</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">4. PAYMENT TERMS</div>
            <div class="info-item">
                <div class="info-label">Rent Due Date:</div>
                <div>Monthly on the 1st day of each month</div>
            </div>
            <div class="info-item">
                <div class="info-label">Late Fee:</div>
                <div>$50.00 if rent is not received within 5 days of due date</div>
            </div>
            <div class="info-item">
                <div class="info-label">Payment Method:</div>
                <div>Electronic payment through Smart Rental System</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">5. UTILITIES AND SERVICES</div>
            <div class="info-item">
                <div>Utilities and services are the responsibility of the tenant unless otherwise specified in writing.</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">6. MAINTENANCE AND REPAIRS</div>
            <div class="info-item">
                <div>The landlord is responsible for major repairs and structural maintenance. The tenant is responsible for minor repairs and general upkeep.</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">7. TERMINATION</div>
            <div class="info-item">
                <div>Either party may terminate this agreement with 30 days written notice. Early termination may result in forfeiture of security deposit.</div>
            </div>
        </div>

        <div class="signature-section">
            <div class="section-title">8. DIGITAL SIGNATURES</div>
            <div class="signature-grid">
                <div class="signature-box">
                    <div>
                        <div class="signature-line">Landlord Signature</div>
                        ${landlord.signatureBase64 ? `<img src="data:image/png;base64,${landlord.signatureBase64}" class="signature-image" alt="Landlord Signature" />` : ''}
                        <div style="margin-top: 10px;">${landlordFullName}</div>
                        <div style="font-size: 12px; color: #666;">Date: ${signedDate}</div>
                    </div>
                </div>
                <div class="signature-box">
                    <div>
                        <div class="signature-line">Tenant Signature</div>
                        ${tenant.signatureBase64 ? `<img src="data:image/png;base64,${tenant.signatureBase64}" class="signature-image" alt="Tenant Signature" />` : ''}
                        <div style="margin-top: 10px;">${tenantFullName}</div>
                        <div style="font-size: 12px; color: #666;">Date: ${signedDate}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="terms">
            <div class="section-title">ADDITIONAL TERMS AND CONDITIONS</div>
            <p>This agreement is subject to all applicable local, state, and federal laws. Any disputes arising from this agreement shall be resolved through mediation or legal proceedings as permitted by law.</p>
            <p>By signing this agreement, both parties acknowledge that they have read, understood, and agree to all terms and conditions outlined herein.</p>
        </div>

        <div class="footer">
            <p>This document was generated by Smart Rental System on ${currentDate}</p>
            <p>Contract ID: ${rentalRequest.id} | Offer ID: ${offer.id}</p>
            ${contractSignature ? `<p>Digitally signed on: ${signedDate}</p>` : ''}
        </div>
    </body>
    </html>
  `;
};

const generatePDF = async (html) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}; 