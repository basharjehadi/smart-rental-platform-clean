import prisma from '../lib/prisma.js';

// Required fields for different user roles
const REQUIRED_FIELDS = {
  TENANT: [
    'firstName', 'lastName', 'pesel', 'passportNumber', 
    'kartaPobytuNumber', 'phoneNumber'
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