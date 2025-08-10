import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimizeSignatureImage, optimizePropertyImage, getOptimizedImageDimensions } from './imageOptimizer.js';
import { compressPDFWithFallback, checkGhostscriptAvailability } from './pdfCompressor.js';
import { translateAdditionalTerms } from './translationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy load the HTML template
let template = null;
const loadTemplate = () => {
  if (!template) {
    try {
      const templatePath = path.join(__dirname, '../templates/contractTemplate.html');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      template = Handlebars.compile(templateSource);
    } catch (error) {
      console.error('❌ Error loading contract template:', error);
      throw new Error('Failed to load contract template');
    }
  }
  return template;
};

// Generate payment schedule with landlord-friendly logic (EXACTLY like payment history page)
const generatePaymentSchedule = (offer) => {
  const schedule = [];
  const monthlyRent = offer.rentAmount;
  const startDate = new Date(offer.leaseStartDate);
  const endDate = new Date(offer.leaseEndDate);

  // Polish landlord-friendly approach: Standard monthly payments
  // First month is already paid with deposit (prorated for partial month)
  // All other months: Full monthly rent due on 10th of each month
  
  // Start from the second month (first month is already paid)
  let currentDate = new Date(startDate);
  currentDate.setMonth(currentDate.getMonth() + 1);
  
  // Set to 1st of the month for consistent calculation
  currentDate.setDate(1);

  let paymentNumber = 2; // Start from payment #2 (first month already paid)

  // Generate payments for each month until lease end (EXACTLY like payment history)
  while (currentDate < endDate) {
    // Calculate due date (10th of the month)
    const dueDate = new Date(currentDate);
    dueDate.setDate(10);

    // Check if this is the last month (EXACTLY like payment history)
    const isLastMonth = currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear();
    
    let amount = monthlyRent;
    
    if (isLastMonth) {
      // Last month: prorated for August 1-16 (16 days) - EXACTLY like payment history
      const daysInLastMonth = endDate.getDate(); // 16 days
      amount = Math.round((monthlyRent * daysInLastMonth) / 30);
    }

    schedule.push({
      number: paymentNumber,
      dueDate: dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      amount: amount
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    paymentNumber++;
  }
  
  return schedule;
};

// Generate contract data from offer with image optimization
const generateContractData = async (offer, user = null) => {
  // Get tenant data from the correct source
  const tenantData = offer.rentalRequest?.tenant || offer.tenant || user;
  
  // Use original payment date for legal consistency
  const paymentDate = offer.originalPaymentDate ? new Date(offer.originalPaymentDate) : new Date();
  const contractDate = paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate contract number
  const contractNumber = offer.originalContractNumber || 
    `SR-${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  
  // Calculate lease dates
  const leaseStartDate = new Date(offer.leaseStartDate);
  const leaseEndDate = new Date(offer.leaseEndDate);
  const leaseMonths = Math.ceil((leaseEndDate - leaseStartDate) / (1000 * 60 * 60 * 24 * 30.44));
  
  // Debug additional terms
  console.log('🔍 Debug additional terms:');
  console.log('Offer description:', offer.description);
  console.log('Offer additionalTerms:', offer.additionalTerms);
  
  // Debug signature data
  console.log('🔍 Debug signature data:');
  console.log('Landlord signature exists:', !!offer.landlord?.signatureBase64);
  console.log('Tenant signature exists:', !!tenantData?.signatureBase64);
  console.log('Landlord data keys:', Object.keys(offer.landlord || {}));
  console.log('Tenant data keys:', Object.keys(tenantData || {}));
  
  // Use original signatures - check if they already have data URL prefix
  const landlordSignature = offer.landlord?.signatureBase64 ? 
    (offer.landlord.signatureBase64.startsWith('data:') ? offer.landlord.signatureBase64 : `data:image/png;base64,${offer.landlord.signatureBase64}`) : null;

  // Translate additional terms with automatic language detection
  const additionalTermsText = offer.description || offer.additionalTerms || '';
  const translatedTerms = await translateAdditionalTerms(additionalTermsText);
  const tenantSignature = tenantData?.signatureBase64 ? 
    (tenantData.signatureBase64.startsWith('data:') ? tenantData.signatureBase64 : `data:image/png;base64,${tenantData.signatureBase64}`) : null;
  
  // Use larger, more realistic dimensions for signature images
  const landlordSignatureDimensions = landlordSignature ? { width: 400, height: 150 } : { width: 0, height: 0 };
  const tenantSignatureDimensions = tenantSignature ? { width: 400, height: 150 } : { width: 0, height: 0 };
  
  return {
    contractNumber,
    contractDate,
    // Landlord information with proper name construction and all identity fields
    landlordName: `${offer.landlord?.firstName || ''} ${offer.landlord?.lastName || ''}`.trim() || offer.landlord?.name || 'Landlord',
    landlordFirstName: offer.landlord?.firstName || 'N/A',
    landlordLastName: offer.landlord?.lastName || 'N/A',
    landlordAddress: offer.landlord?.address || 
      (offer.landlord?.street && offer.landlord?.city ? 
        `${offer.landlord.street}, ${offer.landlord.city}, ${offer.landlord.zipCode || ''}, ${offer.landlord.country || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/g, '') : 
        'N/A'),
    landlordPESEL: offer.landlord?.pesel || 'N/A',
    landlordIdNumber: offer.landlord?.dowodOsobistyNumber || 'N/A',
    landlordPhone: offer.landlord?.phoneNumber || 'N/A',
    landlordEmail: offer.landlord?.email || 'N/A',
    landlordCitizenship: offer.landlord?.citizenship || 'N/A',
    landlordDateOfBirth: offer.landlord?.dateOfBirth ? new Date(offer.landlord.dateOfBirth).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A',
    landlordSignature,
    landlordSignatureWidth: landlordSignatureDimensions.width,
    landlordSignatureHeight: landlordSignatureDimensions.height,
    // Tenant information with proper name construction and all identity fields
    tenantName: `${tenantData?.firstName || ''} ${tenantData?.lastName || ''}`.trim() || tenantData?.name || 'Tenant',
    tenantFirstName: tenantData?.firstName || 'N/A',
    tenantLastName: tenantData?.lastName || 'N/A',
    tenantAddress: tenantData?.address || 
      (tenantData?.street && tenantData?.city ? 
        `${tenantData.street}, ${tenantData.city}, ${tenantData.zipCode || ''}, ${tenantData.country || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/g, '') : 
        'N/A'),
    tenantPESEL: tenantData?.pesel || 'N/A',
    tenantPassportNumber: tenantData?.passportNumber || 'N/A',
    tenantPhone: tenantData?.phoneNumber || 'N/A',
    tenantEmail: tenantData?.email || 'N/A',
    tenantCitizenship: tenantData?.citizenship || 'N/A',
    tenantDateOfBirth: tenantData?.dateOfBirth ? new Date(tenantData.dateOfBirth).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A',
    tenantProfession: tenantData?.profession || 'N/A',
    tenantSignature,
    tenantSignatureWidth: tenantSignatureDimensions.width,
    tenantSignatureHeight: tenantSignatureDimensions.height,
    propertyAddress: offer.property?.address || 'N/A',
    monthlyRent: offer.rentAmount,
    securityDeposit: offer.depositAmount,
    leaseMonths,
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
    additionalTerms: translatedTerms.english,
    additionalTermsPolish: translatedTerms.polish,
    paymentSchedule: generatePaymentSchedule(offer)
  };
};

// Generate HTML from template
export const generateContractHTML = async (offer, user = null) => {
  const contractData = await generateContractData(offer, user);
  const template = loadTemplate();
  return template(contractData);
};

// Generate PDF using Puppeteer with optimization
export const generateContractPDF = async (offer, user = null) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });
    
    // Generate HTML content with optimized images
    const htmlContent = await generateContractHTML(offer, user);
    
    // Set content and wait for rendering
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      // Optimize for smaller file size
      omitBackground: false,
      displayHeaderFooter: false
    });
    
    return pdf;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

// Save PDF to file system with compression
export const saveContractPDF = async (offer, user = null, contractNumber = null) => {
  console.log('🔧 Generating optimized PDF...');
  
  const pdfBuffer = await generateContractPDF(offer, user);
  
  // Create contracts directory if it doesn't exist
  const contractsDir = path.join(process.cwd(), 'uploads', 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // Generate filename
  const filename = contractNumber || 
    `SR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  
  const tempFilePath = path.join(contractsDir, `temp_${filename}.pdf`);
  const finalFilePath = path.join(contractsDir, `${filename}.pdf`);
  
  // Save temporary PDF file
  fs.writeFileSync(tempFilePath, pdfBuffer);
  
  console.log(`📄 Temporary PDF saved: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  
  // Check if Ghostscript is available for compression
  const ghostscriptAvailable = await checkGhostscriptAvailability();
  
  if (ghostscriptAvailable) {
    try {
      // Compress PDF using Ghostscript
      const compressionResult = await compressPDFWithFallback(tempFilePath, finalFilePath);
      
      // Remove temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      console.log(`✅ Final PDF size: ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)} MB`);
      
      return {
        filePath: finalFilePath,
        filename: `${filename}.pdf`,
        url: `/uploads/contracts/${filename}.pdf`,
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio
      };
      
    } catch (error) {
      console.error('❌ PDF compression failed:', error);
      // Use uncompressed file if compression fails
      fs.renameSync(tempFilePath, finalFilePath);
    }
  } else {
    // No Ghostscript available, use uncompressed file
    fs.renameSync(tempFilePath, finalFilePath);
    console.log('⚠️ Using uncompressed PDF (Ghostscript not available)');
  }
  
  return {
    filePath: finalFilePath,
    filename: `${filename}.pdf`,
    url: `/uploads/contracts/${filename}.pdf`,
    originalSize: pdfBuffer.length,
    compressedSize: pdfBuffer.length,
    compressionRatio: 0
  };
};

// Generate contract data for API responses
export const generateContractDataForAPI = (offer, user = null) => {
  return generateContractData(offer, user);
};
