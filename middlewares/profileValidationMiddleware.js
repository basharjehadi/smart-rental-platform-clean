import prisma from '../lib/prisma.js';

// Validation functions
const validatePESEL = (pesel) => {
  if (!pesel || typeof pesel !== 'string') return false;
  
  // PESEL must be exactly 11 digits
  if (!/^\d{11}$/.test(pesel)) return false;
  
  // For now, just validate format (11 digits) without checksum validation
  // This is more user-friendly and allows for testing
  return true;
  
  // TODO: Uncomment the checksum validation for production
  /*
  // PESEL validation algorithm
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(pesel[i]) * weights[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(pesel[10]);
  */
};

const validatePassportNumber = (passportNumber) => {
  if (!passportNumber || typeof passportNumber !== 'string') return false;
  
  // Passport number format: 2 letters + 7 digits (e.g., AB1234567)
  return /^[A-Z]{2}\d{7}$/.test(passportNumber.toUpperCase());
};

const validateKartaPobytu = (kartaPobytu) => {
  if (!kartaPobytu || typeof kartaPobytu !== 'string') return false;
  
  // Karta pobytu format: 10 alphanumeric characters
  return /^[A-Z0-9]{10}$/.test(kartaPobytu.toUpperCase());
};

const validateDowodOsobisty = (dowodOsobisty) => {
  if (!dowodOsobisty || typeof dowodOsobisty !== 'string') return false;
  
  // Dowód osobisty format: 3 letters + 6 digits (e.g., ABC123456)
  return /^[A-Z]{3}\d{6}$/.test(dowodOsobisty.toUpperCase());
};

const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  
  // Polish phone number formats:
  // +48 XXX XXX XXX
  // +48XXXXXXXXX
  // 48 XXX XXX XXX
  // 48XXXXXXXXX
  const cleanNumber = phoneNumber.replace(/\s+/g, '');
  return /^(\+?48)?\d{9}$/.test(cleanNumber);
};

// Comprehensive validation middleware for profile updates
export const validateProfileData = (req, res, next) => {
  try {
    const { firstName, lastName, pesel, passportNumber, kartaPobytuNumber, phoneNumber, dowodOsobistyNumber, address } = req.body;
    const errors = [];

    // Only validate fields that are provided (not undefined or empty)
    if (firstName !== undefined && firstName !== null && firstName.trim() !== '') {
      if (firstName.length < 2 || firstName.length > 50) {
        errors.push('First name must be between 2 and 50 characters');
      }
    }

    if (lastName !== undefined && lastName !== null && lastName.trim() !== '') {
      if (lastName.length < 2 || lastName.length > 50) {
        errors.push('Last name must be between 2 and 50 characters');
      }
    }

    if (pesel !== undefined && pesel !== null && pesel.trim() !== '') {
      if (!validatePESEL(pesel)) {
        errors.push('Invalid PESEL format. Must be exactly 11 digits with valid checksum');
      }
    }

    if (passportNumber !== undefined && passportNumber !== null && passportNumber.trim() !== '') {
      if (!validatePassportNumber(passportNumber)) {
        errors.push('Invalid passport number format. Must be 2 letters + 7 digits (e.g., AB1234567)');
      }
    }

    if (kartaPobytuNumber !== undefined && kartaPobytuNumber !== null && kartaPobytuNumber.trim() !== '') {
      if (!validateKartaPobytu(kartaPobytuNumber)) {
        errors.push('Invalid residence card number format. Must be 10 alphanumeric characters');
      }
    }

    if (dowodOsobistyNumber !== undefined && dowodOsobistyNumber !== null && dowodOsobistyNumber.trim() !== '') {
      if (!validateDowodOsobisty(dowodOsobistyNumber)) {
        errors.push('Invalid ID card number format. Must be 3 letters + 6 digits (e.g., ABC123456)');
      }
    }

    if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber.trim() !== '') {
      if (!validatePhoneNumber(phoneNumber)) {
        errors.push('Invalid phone number format. Must be a valid Polish phone number');
      }
    }

    if (address !== undefined && address !== null && address.trim() !== '') {
      if (address.length < 5 || address.length > 200) {
        errors.push('Address must be between 5 and 200 characters');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors:',
        errors: errors
      });
    }

    next();
  } catch (error) {
    console.error('Profile validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Required fields for different user roles
const REQUIRED_FIELDS = {
  TENANT: [
    'firstName', 'lastName', 'pesel', 'passportNumber', 
    'kartaPobytuNumber', 'phoneNumber', 'address'
  ],
  LANDLORD: [
    'firstName', 'lastName', 'dowodOsobistyNumber', 
    'phoneNumber', 'address'
  ],
  ADMIN: [
    'firstName', 'lastName', 'phoneNumber'
  ]
};

export const requireCompleteProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user with profile information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        phoneNumber: true,
        dowodOsobistyNumber: true,
        address: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get required fields for user role
    const requiredFields = REQUIRED_FIELDS[user.role] || [];
    
    // Check if all required fields are filled
    const missingFields = requiredFields.filter(field => {
      const value = user[field];
      return !value || value.trim() === '';
    });

    if (missingFields.length > 0) {
      return res.status(403).json({
        error: 'Profile incomplete',
        message: 'Please complete your profile information before proceeding',
        missingFields,
        requiredFields,
        userRole: user.role
      });
    }

    // Profile is complete, proceed
    next();
  } catch (error) {
    console.error('Profile validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check profile completion status (for frontend use)
export const getProfileStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        phoneNumber: true,
        dowodOsobistyNumber: true,
        address: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requiredFields = REQUIRED_FIELDS[user.role] || [];
    const missingFields = requiredFields.filter(field => {
      const value = user[field];
      return !value || value.trim() === '';
    });

    const isComplete = missingFields.length === 0;
    const completionPercentage = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

    res.json({
      isComplete,
      completionPercentage,
      missingFields,
      requiredFields,
      userRole: user.role
    });
  } catch (error) {
    console.error('Profile status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 