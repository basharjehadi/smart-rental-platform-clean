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

  // Generate payments for each month until lease end
  while (currentDate < endDate) {
    // Determine if last month (potentially prorated)
    const isLastMonth = currentDate.getMonth() === endDate.getMonth() && currentDate.getFullYear() === endDate.getFullYear();

    // Due date: 10th normally, 1st only for the prorated last month
    const dueDate = new Date(currentDate);
    dueDate.setDate(isLastMonth ? 1 : 10);

    let amount = monthlyRent;
    
    if (isLastMonth) {
      // Last month: prorated for days up to lease end date; due on the 1st of that month
      const daysInLastMonth = endDate.getDate();
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
  console.log('Tenant data keys:', Object.keys(offer.tenantGroup || {}));
  
  // Use original signatures - check if they already have data URL prefix
  const landlordSignature = offer.landlord?.signatureBase64 ? 
    (offer.landlord.signatureBase64.startsWith('data:') ? offer.landlord.signatureBase64 : `data:image/png;base64,${offer.landlord.signatureBase64}`) : null;

  // Translate additional terms with automatic language detection
  const additionalTermsText = offer.description || offer.additionalTerms || '';
  const translatedTerms = await translateAdditionalTerms(additionalTermsText);
  
  // Use larger, more realistic dimensions for signature images
  const landlordSignatureDimensions = landlordSignature ? { width: 400, height: 150 } : { width: 0, height: 0 };
  
  // 🔍 SCENARIO DETECTION: Determine contract type and prepare data
  console.log('🔍 Detecting contract scenario...');
  
  // 1. Check if landlord is a business (has organization)
  const isLandlordBusiness = !!offer.property?.organization;
  console.log('🏢 Is landlord business?', isLandlordBusiness);
  
  // 2. Check if tenant is a business (has organization)
  const isTenantBusiness = !!offer.organization;
  console.log('🏢 Is tenant business?', isTenantBusiness);
  
  // 3. Check if tenant is a group (has multiple members)
  const isTenantGroup = !!offer.tenantGroup && offer.tenantGroup.members && offer.tenantGroup.members.length > 0;
  console.log('👥 Is tenant group?', isTenantGroup);
  
  // Prepare landlord data based on scenario
  let landlordData = {};
  
  if (isLandlordBusiness) {
    // Business landlord - use organization data
    const org = offer.property.organization;
    landlordData = {
      type: 'business',
      name: org.name || 'Business Landlord',
      taxId: org.taxId || 'N/A',
      regNumber: org.regNumber || 'N/A',
      address: org.address || 'N/A',
      signature: org.signatureBase64 ? 
        (org.signatureBase64.startsWith('data:') ? org.signatureBase64 : `data:image/png;base64,${org.signatureBase64}`) : null,
      // Individual contact person (if available)
      contactPerson: offer.landlord ? {
        name: `${offer.landlord.firstName || ''} ${offer.landlord.lastName || ''}`.trim() || offer.landlord.name || 'Contact Person',
        firstName: offer.landlord.firstName || 'N/A',
        lastName: offer.landlord.lastName || 'N/A',
        phone: offer.landlord.phoneNumber || 'N/A',
        email: offer.landlord.email || 'N/A'
      } : null
    };
  } else {
    // Individual landlord - use user data
    landlordData = {
      type: 'individual',
      name: `${offer.landlord?.firstName || ''} ${offer.landlord?.lastName || ''}`.trim() || offer.landlord?.name || 'Landlord',
      firstName: offer.landlord?.firstName || 'N/A',
      lastName: offer.landlord?.lastName || 'N/A',
      address: offer.landlord?.address || 
        (offer.landlord?.street && offer.landlord?.city ? 
          `${offer.landlord.street}, ${offer.landlord.city}, ${offer.landlord.zipCode || ''}, ${offer.landlord.country || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/g, '') : 
          'N/A'),
      pesel: offer.landlord?.pesel || 'N/A',
      idNumber: offer.landlord?.dowodOsobistyNumber || 'N/A',
      phone: offer.landlord?.phoneNumber || 'N/A',
      email: offer.landlord?.email || 'N/A',
      citizenship: offer.landlord?.citizenship || 'N/A',
      dateOfBirth: offer.landlord?.dateOfBirth ? new Date(offer.landlord.dateOfBirth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A',
      signature: landlordSignature
    };
  }
  
  // Prepare tenant data based on scenario
  let tenantData = {};
  
  if (isTenantBusiness) {
    // Business tenant - use organization data
    const org = offer.organization;
    tenantData = {
      type: 'business',
      name: org.name || 'Business Tenant',
      taxId: org.taxId || 'N/A',
      regNumber: org.regNumber || 'N/A',
      address: org.address || 'N/A',
      signature: org.signatureBase64 ? 
        (org.signatureBase64.startsWith('data:') ? org.signatureBase64 : `data:image/png;base64,${org.signatureBase64}`) : null,
      // Individual contact person (if available)
      contactPerson: offer.tenantGroup?.members?.[0]?.user ? {
        name: `${offer.tenantGroup.members[0].user.firstName || ''} ${offer.tenantGroup.members[0].user.lastName || ''}`.trim() || offer.tenantGroup.members[0].user.name || 'Contact Person',
        firstName: offer.tenantGroup.members[0].user.firstName || 'N/A',
        lastName: offer.tenantGroup.members[0].user.lastName || 'N/A',
        phone: offer.tenantGroup.members[0].user.phoneNumber || 'N/A',
        email: offer.tenantGroup.members[0].user.email || 'N/A'
      } : null
    };
  } else if (isTenantGroup) {
    // Group tenant - use tenant group data
    const group = offer.tenantGroup;
    tenantData = {
      type: 'group',
      groupName: group.name || 'Tenant Group',
      members: group.members.map(member => ({
        id: member.user.id,
        name: `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.name || 'Group Member',
        firstName: member.user.firstName || 'N/A',
        lastName: member.user.lastName || 'N/A',
        address: member.user.address || 
          (member.user.street && member.user.city ? 
            `${member.user.street}, ${member.user.city}, ${member.user.zipCode || ''}, ${member.user.country || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/g, '') : 
            'N/A'),
        pesel: member.user.pesel || 'N/A',
        passportNumber: member.user.passportNumber || 'N/A',
        phone: member.user.phoneNumber || 'N/A',
        email: member.user.email || 'N/A',
        citizenship: member.user.citizenship || 'N/A',
        dateOfBirth: member.user.dateOfBirth ? new Date(member.user.dateOfBirth).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A',
        profession: member.user.profession || 'N/A',
        signature: member.user.signatureBase64 ? 
          (member.user.signatureBase64.startsWith('data:') ? member.user.signatureBase64 : `data:image/png;base64,${member.user.signatureBase64}`) : null,
        isPrimary: member.isPrimary
      })),
      // Primary member signature for contract
      primarySignature: group.members.find(m => m.isPrimary)?.user.signatureBase64 ? 
        (group.members.find(m => m.isPrimary).user.signatureBase64.startsWith('data:') ? 
          group.members.find(m => m.isPrimary).user.signatureBase64 : 
          `data:image/png;base64,${group.members.find(m => m.isPrimary).user.signatureBase64}`) : null
    };
  } else {
    // Individual tenant - use user data (fallback)
    const userData = offer.tenantGroup?.members?.[0]?.user || user;
    tenantData = {
      type: 'individual',
      name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.name || 'Tenant',
      firstName: userData?.firstName || 'N/A',
      lastName: userData?.lastName || 'N/A',
      address: userData?.address || 
        (userData?.street && userData?.city ? 
          `${userData.street}, ${userData.city}, ${userData.zipCode || ''}, ${userData.country || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/g, '') : 
          'N/A'),
      pesel: userData?.pesel || 'N/A',
      passportNumber: userData?.passportNumber || 'N/A',
      phone: userData?.phoneNumber || 'N/A',
      email: userData?.email || 'N/A',
      citizenship: userData?.citizenship || 'N/A',
      dateOfBirth: userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A',
      profession: userData?.profession || 'N/A',
      signature: userData?.signatureBase64 ? 
        (userData.signatureBase64.startsWith('data:') ? userData.signatureBase64 : `data:image/png;base64,${userData.signatureBase64}`) : null
    };
  }
  
  // Prepare occupants data for business tenants
  let occupantsData = [];
  if (isTenantBusiness && offer.rentalRequest?.occupants) {
    // If we have occupants from the rental request, use them
    occupantsData = offer.rentalRequest.occupants;
  } else if (isTenantGroup) {
    // For tenant groups, create occupants from group members
    occupantsData = tenantData.members.map(member => ({
      name: member.name,
      role: member.profession || 'Tenant',
      email: member.email,
      phone: member.phone
    }));
  }
  
  // Calculate signature dimensions
  const tenantSignatureDimensions = tenantData.signature || tenantData.primarySignature ? { width: 400, height: 150 } : { width: 0, height: 0 };
  
  // Build the final contract data object
  const contractData = {
    contractNumber,
    contractDate,
    // Scenario flags
    isLandlordBusiness,
    isTenantBusiness,
    isTenantGroup,
    // Landlord information
    landlordType: landlordData.type,
    landlordName: landlordData.name,
    landlordTaxId: landlordData.taxId || 'N/A',
    landlordRegNumber: landlordData.regNumber || 'N/A',
    landlordAddress: landlordData.address,
    landlordSignature: landlordData.signature,
    landlordSignatureWidth: landlordSignatureDimensions.width,
    landlordSignatureHeight: landlordSignatureDimensions.height,
    // Individual landlord fields (for business landlords with contact person)
    landlordFirstName: landlordData.firstName || landlordData.contactPerson?.firstName || 'N/A',
    landlordLastName: landlordData.lastName || landlordData.contactPerson?.lastName || 'N/A',
    landlordPESEL: landlordData.pesel || 'N/A',
    landlordIdNumber: landlordData.idNumber || 'N/A',
    landlordPhone: landlordData.phone || landlordData.contactPerson?.phone || 'N/A',
    landlordEmail: landlordData.email || landlordData.contactPerson?.email || 'N/A',
    landlordCitizenship: landlordData.citizenship || 'N/A',
    landlordDateOfBirth: landlordData.dateOfBirth || 'N/A',
    // Tenant information
    tenantType: tenantData.type,
    tenantName: tenantData.name,
    tenantGroupName: tenantData.groupName || 'N/A',
    tenantTaxId: tenantData.taxId || 'N/A',
    tenantRegNumber: tenantData.regNumber || 'N/A',
    tenantAddress: tenantData.address,
    tenantSignature: tenantData.signature || tenantData.primarySignature,
    tenantSignatureWidth: tenantSignatureDimensions.width,
    tenantSignatureHeight: tenantSignatureDimensions.height,
    // Individual tenant fields (for group tenants or individual tenants)
    tenantFirstName: tenantData.firstName || 'N/A',
    tenantLastName: tenantData.lastName || 'N/A',
    tenantPESEL: tenantData.pesel || 'N/A',
    tenantPassportNumber: tenantData.passportNumber || 'N/A',
    tenantPhone: tenantData.phone || 'N/A',
    tenantEmail: tenantData.email || 'N/A',
    tenantCitizenship: tenantData.citizenship || 'N/A',
    tenantDateOfBirth: tenantData.dateOfBirth || 'N/A',
    tenantProfession: tenantData.profession || 'N/A',
    // Group members (for tenant groups)
    tenantGroupMembers: tenantData.members || [],
    // Occupants (for business tenants)
    occupants: occupantsData,
    // Property information
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
  
  console.log('🔍 Contract data prepared for scenario:', {
    landlordType: landlordData.type,
    tenantType: tenantData.type,
    hasOccupants: occupantsData.length > 0,
    groupMembers: tenantData.members?.length || 0
  });
  
  return contractData;
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
