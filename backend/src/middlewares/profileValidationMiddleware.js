import { prisma } from '../utils/prisma.js';

// Required fields for each role
const REQUIRED_FIELDS = {
  TENANT: ['firstName', 'lastName', 'phoneNumber'],
  LANDLORD: ['firstName', 'lastName', 'phoneNumber'],
  ADMIN: ['firstName', 'lastName']
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phoneNumber) => {
  // Basic phone validation - allows international format
  const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
  return phoneRegex.test(phoneNumber);
};

const validatePESEL = (pesel) => {
  if (!pesel) return false;
  // Basic PESEL validation (11 digits)
  const peselRegex = /^\d{11}$/;
  return peselRegex.test(pesel);
};

const validatePassportNumber = (passportNumber) => {
  if (!passportNumber) return false;
  // Basic passport validation (alphanumeric, 6-9 characters)
  const passportRegex = /^[A-Z0-9]{6,9}$/;
  return passportRegex.test(passportNumber);
};

const validateKartaPobytu = (kartaPobytuNumber) => {
  if (!kartaPobytuNumber) return false;
  // Basic residence card validation
  const kartaRegex = /^[A-Z0-9]{9}$/;
  return kartaRegex.test(kartaPobytuNumber);
};

const validateDowodOsobisty = (dowodOsobistyNumber) => {
  if (!dowodOsobistyNumber) return false;
  // Basic Polish ID card validation
  const dowodRegex = /^[A-Z]{3}\d{6}$/;
  return dowodRegex.test(dowodOsobistyNumber);
};

// Enhanced validation middleware
export const validateProfileData = async (req, res, next) => {
  try {
    const { role } = req.user;
    const data = req.body;
    const errors = [];

    // Check required fields for the role
    const requiredFields = REQUIRED_FIELDS[role] || [];
    
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        errors.push(`${field} is required for ${role.toLowerCase()}s`);
      }
    }

    // Validate email if provided
    if (data.email && !validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone number if provided
    if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    // Role-specific validations
    if (role === 'TENANT') {
      if (data.pesel && !validatePESEL(data.pesel)) {
        errors.push('Invalid PESEL format (should be 11 digits)');
      }
      if (data.passportNumber && !validatePassportNumber(data.passportNumber)) {
        errors.push('Invalid passport number format');
      }
      if (data.kartaPobytuNumber && !validateKartaPobytu(data.kartaPobytuNumber)) {
        errors.push('Invalid residence card number format');
      }
    }

    if (role === 'LANDLORD') {
      if (data.dowodOsobistyNumber && !validateDowodOsobisty(data.dowodOsobistyNumber)) {
        errors.push('Invalid Polish ID card number format');
      }
    }

    // Check for duplicate email if email is being updated
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: req.user.id }
        }
      });
      
      if (existingUser) {
        errors.push('Email already exists');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  } catch (error) {
    console.error('Profile validation error:', error);
    res.status(500).json({
      error: 'Validation error occurred'
    });
  }
};

// Get profile completion status
export const getProfileStatus = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        citizenship: true,
        dateOfBirth: true,
        street: true,
        city: true,
        zipCode: true,
        country: true,
        profession: true,
        address: true,
        dowodOsobistyNumber: true,
        profileImage: true,
        signatureBase64: true,
        identityDocument: true,
        isVerified: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requiredFields = REQUIRED_FIELDS[user.role] || [];
    const completedFields = requiredFields.filter(field => 
      user[field] && user[field].toString().trim() !== ''
    );

    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    
    const missingFields = requiredFields.filter(field => 
      !user[field] || user[field].toString().trim() === ''
    );

    res.json({
      completionPercentage,
      completedFields: completedFields.length,
      totalFields: requiredFields.length,
      missingFields,
      isVerified: user.isVerified,
      hasProfileImage: !!user.profileImage,
      hasSignature: !!user.signatureBase64,
      hasIdentityDocument: !!user.identityDocument
    });
  } catch (error) {
    console.error('Get profile status error:', error);
    res.status(500).json({ error: 'Failed to get profile status' });
  }
}; 