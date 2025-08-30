import { PrismaClient } from '@prisma/client';
import { getUserTrustLevel } from '../services/trustLevels.js';
import { getUserBadges } from '../services/badges.js';

const prisma = new PrismaClient();

// Get user identity data
export const getUserIdentity = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        phoneNumber: true,
        dowodOsobistyNumber: true,
        address: true,
        profileImage: true,
        signatureBase64: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user identity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        phoneNumber: true,
        citizenship: true,
        dateOfBirth: true,
        street: true,
        city: true,
        zipCode: true,
        country: true,
        profession: true,
        dowodOsobistyNumber: true,
        address: true,
        profileImage: true,
        signatureBase64: true,
        identityDocument: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate user's trust level
    try {
      const trustLevelData = await getUserTrustLevel(userId);
      user.trustLevel = trustLevelData.level;
      user.trustLevelDetails = trustLevelData;
    } catch (trustLevelError) {
      console.warn(
        'Failed to calculate trust level for user:',
        userId,
        trustLevelError
      );
      user.trustLevel = 'New';
      user.trustLevelDetails = null;
    }

    // Get user's badges
    try {
      const userBadges = await getUserBadges(userId);
      user.badges = userBadges;
    } catch (badgeError) {
      console.warn(
        'Failed to get badges for user:',
        userId,
        badgeError
      );
      user.badges = [];
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user trust level by user ID
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User object with trust level information
 */
export const getUserWithTrustLevel = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Calculate user's trust level
    try {
      const trustLevelData = await getUserTrustLevel(userId);
      user.trustLevel = trustLevelData.level;
      user.trustLevelDetails = trustLevelData;
    } catch (trustLevelError) {
      console.warn(
        'Failed to calculate trust level for user:',
        userId,
        trustLevelError
      );
      user.trustLevel = 'New';
      user.trustLevelDetails = null;
    }

    return user;
  } catch (error) {
    console.error('Error getting user with trust level:', error);
    return null;
  }
};

/**
 * Get user trust level by user ID (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserTrustLevelById = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Users can view their own trust level, admin can view all
    if (requestingUserId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own trust level',
      });
    }

    const userWithTrustLevel = await getUserWithTrustLevel(userId);

    if (!userWithTrustLevel) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    res.json({
      success: true,
      data: {
        userId: userWithTrustLevel.id,
        name: userWithTrustLevel.name,
        trustLevel: userWithTrustLevel.trustLevel,
        trustLevelDetails: userWithTrustLevel.trustLevelDetails,
      },
    });
  } catch (error) {
    console.error('Get user trust level error:', error);
    res.status(500).json({
      error: 'Failed to get user trust level',
      message: 'An error occurred while fetching user trust level',
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      pesel,
      passportNumber,
      kartaPobytuNumber,
      phoneNumber,
      citizenship,
      dateOfBirth,
      street,
      city,
      zipCode,
      country,
      profession,
      dowodOsobistyNumber,
      address,
      profileImage,
    } = req.body;

    // Validate required fields based on role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};

    // Common fields for all users
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (citizenship !== undefined) updateData.citizenship = citizenship;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (country !== undefined) updateData.country = country;
    if (profession !== undefined) updateData.profession = profession;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    if (user.role === 'TENANT') {
      // Tenant-specific fields
      if (pesel !== undefined) updateData.pesel = pesel;
      if (passportNumber !== undefined)
        updateData.passportNumber = passportNumber;
      if (kartaPobytuNumber !== undefined)
        updateData.kartaPobytuNumber = kartaPobytuNumber;
      if (address !== undefined) updateData.address = address; // Allow address for tenants too
    } else if (user.role === 'LANDLORD') {
      // Landlord-specific fields - handle both PESEL and ID card number
      if (pesel !== undefined) updateData.pesel = pesel;
      if (dowodOsobistyNumber !== undefined)
        updateData.dowodOsobistyNumber = dowodOsobistyNumber;
      if (address !== undefined) updateData.address = address;
    }

    // Validate PESEL format (11 digits)
    if (updateData.pesel && !/^\d{11}$/.test(updateData.pesel)) {
      return res.status(400).json({ error: 'PESEL must be exactly 11 digits' });
    }

    // Validate phone number format (basic validation)
    if (
      updateData.phoneNumber &&
      !/^[\+]?[0-9\s\-\(\)]{9,15}$/.test(updateData.phoneNumber)
    ) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        phoneNumber: true,
        citizenship: true,
        dateOfBirth: true,
        street: true,
        city: true,
        zipCode: true,
        country: true,
        profession: true,
        dowodOsobistyNumber: true,
        address: true,
        profileImage: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user identity data (for contract purposes)
export const updateUserIdentity = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      pesel,
      passportNumber,
      kartaPobytuNumber,
      phoneNumber,
      dowodOsobistyNumber,
      address,
    } = req.body;

    // Validate required fields based on role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};

    if (user.role === 'TENANT') {
      // Tenant-specific validation
      if (!firstName || !lastName) {
        return res
          .status(400)
          .json({ error: 'First name and last name are required for tenants' });
      }
      updateData.firstName = firstName;
      updateData.lastName = lastName;
      updateData.pesel = pesel;
      updateData.passportNumber = passportNumber;
      updateData.kartaPobytuNumber = kartaPobytuNumber;
      updateData.phoneNumber = phoneNumber;
      updateData.address = address; // Allow address for tenants too
    } else if (user.role === 'LANDLORD') {
      // Landlord-specific validation
      if (!firstName || !lastName) {
        return res.status(400).json({
          error: 'First name and last name are required for landlords',
        });
      }
      updateData.firstName = firstName;
      updateData.lastName = lastName;
      updateData.dowodOsobistyNumber = dowodOsobistyNumber;
      updateData.phoneNumber = phoneNumber;
      updateData.address = address;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        pesel: true,
        passportNumber: true,
        kartaPobytuNumber: true,
        phoneNumber: true,
        dowodOsobistyNumber: true,
        address: true,
      },
    });

    res.json({
      message: 'Identity data updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user identity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save user signature
export const saveUserSignature = async (req, res) => {
  try {
    const userId = req.user.id;
    const { signatureBase64 } = req.body;

    if (!signatureBase64) {
      return res.status(400).json({ error: 'Signature data is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { signatureBase64 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        signatureBase64: true,
      },
    });

    res.json({
      message: 'Signature saved successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Save user signature error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Save contract signatures
export const saveContractSignatures = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const { tenantSignatureBase64, landlordSignatureBase64 } = req.body;
    const userId = req.user.id;

    // Verify user has access to this rental request
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      include: {
        tenant: true,
        offer: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is tenant or landlord
    const isTenant = rentalRequest.tenantGroup?.members?.some(
      (m) => m.userId === userId
    );
    const isLandlord = rentalRequest.offer?.landlordId === userId;

    if (!isTenant && !isLandlord) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to sign this contract' });
    }

    // Create or update contract signature
    const contractSignature = await prisma.contractSignature.upsert({
      where: { rentalRequestId },
      update: {
        tenantSignatureBase64: isTenant ? tenantSignatureBase64 : undefined,
        landlordSignatureBase64: isLandlord
          ? landlordSignatureBase64
          : undefined,
        signedAt: new Date(),
      },
      create: {
        rentalRequestId,
        tenantSignatureBase64: isTenant ? tenantSignatureBase64 : null,
        landlordSignatureBase64: isLandlord ? landlordSignatureBase64 : null,
      },
    });

    res.json({
      message: 'Contract signatures saved successfully',
      contractSignature,
    });
  } catch (error) {
    console.error('Save contract signatures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get contract signatures
export const getContractSignatures = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this rental request
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: rentalRequestId },
      include: {
        tenant: true,
        offer: {
          include: {
            landlord: true,
          },
        },
      },
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is tenant or landlord
    const isTenant = rentalRequest.tenantGroup?.members?.some(
      (m) => m.userId === userId
    );
    const isLandlord = rentalRequest.offer?.landlordId === userId;

    if (!isTenant && !isLandlord) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to view this contract' });
    }

    const contractSignature = await prisma.contractSignature.findUnique({
      where: { rentalRequestId },
    });

    res.json({
      contractSignature,
      userRole: isTenant ? 'TENANT' : 'LANDLORD',
    });
  } catch (error) {
    console.error('Get contract signatures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload identity document
export const uploadIdentityDocument = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload',
      });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and PDF files are allowed',
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB',
      });
    }

    // Get the filename from the uploaded file
    const filename = req.file.filename;
    const filePath = `uploads/identity_documents/${filename}`;

    // Get GDPR consent data from request body
    const { gdprConsent, gdprConsentDate } = req.body;

    // Prepare update data
    const updateData = {
      identityDocument: filename,
    };

    // Add GDPR consent data if provided
    if (gdprConsent === 'true' && gdprConsentDate) {
      updateData.gdprConsent = true;
      updateData.gdprConsentDate = new Date(gdprConsentDate);
    }

    // Set KYC status to PENDING when documents are uploaded
    updateData.kycStatus = 'PENDING';
    updateData.kycSubmittedAt = new Date();

    // Update user record with identity document filename and GDPR consent
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identityDocument: true,
        gdprConsent: true,
        gdprConsentDate: true,
        kycStatus: true,
        kycSubmittedAt: true,
        updatedAt: true,
      },
    });

    console.log(
      `✅ Identity document uploaded for user ${userId}: ${filename}`
    );

    res.status(200).json({
      success: true,
      message: 'Identity document uploaded successfully',
      data: {
        filename: filename,
        filePath: filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Upload identity document error:', error);
    res.status(500).json({
      error: 'Failed to upload identity document',
      message: 'An error occurred while processing your upload',
    });
  }
};

// Get profile completion status
export const getProfileStatus = async (req, res) => {
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
        address: true,
        email: true,
        kycStatus: true,
        isVerified: true,
        gdprConsent: true,
        signatureBase64: true,
        profileImage: true,
        phoneVerified: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Define required fields for different user roles
    const REQUIRED_FIELDS = {
      TENANT: [
        'firstName',
        'lastName',
        'pesel',
        'passportNumber',
        'kartaPobytuNumber',
        'phoneNumber',
        'address',
      ],
      LANDLORD: [
        'firstName',
        'lastName',
        'dowodOsobistyNumber',
        'phoneNumber',
        'address',
      ],
      ADMIN: ['firstName', 'lastName', 'phoneNumber'],
    };

    const requiredFields = REQUIRED_FIELDS[user.role] || [];
    const missingFields = requiredFields.filter((field) => {
      const value = user[field];
      return !value || value.trim() === '';
    });

    // Additional verification requirements
    const verificationRequirements = [];
    const missingVerifications = [];

    // Email verification (always required)
    verificationRequirements.push('emailVerified');
    if (!user.emailVerified) {
      missingVerifications.push('emailVerified');
    }

    // Phone verification (always required)
    verificationRequirements.push('phoneVerified');
    if (!user.phoneVerified) {
      missingVerifications.push('phoneVerified');
    }

    // KYC verification (required for all users)
    verificationRequirements.push('kycVerified');
    if (user.kycStatus !== 'APPROVED') {
      missingVerifications.push('kycVerified');
    }

    // GDPR consent (required for all users)
    verificationRequirements.push('gdprConsent');
    if (!user.gdprConsent) {
      missingVerifications.push('gdprConsent');
    }

    // Signature (optional but recommended)
    if (!user.signatureBase64) {
      missingVerifications.push('signature');
    }

    // Profile photo (optional but recommended)
    if (!user.profileImage) {
      missingVerifications.push('profilePhoto');
    }

    // Calculate completion percentage
    const totalRequirements =
      requiredFields.length + verificationRequirements.length;
    const completedRequirements =
      requiredFields.length -
      missingFields.length +
      (verificationRequirements.length - missingVerifications.length);

    const completionPercentage = Math.round(
      (completedRequirements / totalRequirements) * 100
    );

    // Profile is complete if all required fields and verifications are done
    const isComplete =
      missingFields.length === 0 &&
      !missingVerifications.includes('emailVerified') &&
      !missingVerifications.includes('phoneVerified') &&
      !missingVerifications.includes('kycVerified') &&
      !missingVerifications.includes('gdprConsent');

    res.json({
      isComplete,
      completionPercentage,
      missingFields,
      missingVerifications,
      requiredFields,
      verificationRequirements,
      userRole: user.role,
      kycStatus: user.kycStatus,
      gdprConsent: user.gdprConsent,
      hasSignature: !!user.signatureBase64,
      hasProfilePhoto: !!user.profileImage,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('Profile status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No photo file provided.',
      });
    }

    const userId = req.user.id;
    const file = req.file;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Only JPG, JPEG, and PNG files are allowed.',
      });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File size must be less than 5MB.',
      });
    }

    // File is already saved by multer middleware
    // Generate URL for the saved file - store just the filename for consistency
    const photoUrl = file.filename;

    // Update user profile with photo URL
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: photoUrl },
    });

    res.json({
      message: 'Profile photo uploaded successfully.',
      photoUrl: photoUrl,
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({
      error: 'Internal server error.',
    });
  }
};

// Delete profile photo
export const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user to find existing photo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      // Delete file from filesystem
      const fs = await import('fs');
      const path = await import('path');

      // Construct path to profile_images directory
      const photoPath = path.join(
        process.cwd(),
        'uploads',
        'profile_images',
        user.profileImage
      );
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Update user to remove photo reference
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
    });

    res.json({
      message: 'Profile photo deleted successfully.',
    });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({
      error: 'Internal server error.',
    });
  }
};

// Admin function to get all pending KYC submissions
export const getPendingKYC = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can access this endpoint',
      });
    }

    const pendingKYC = await prisma.user.findMany({
      where: {
        kycStatus: 'PENDING',
        identityDocument: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        identityDocument: true,
        kycStatus: true,
        kycSubmittedAt: true,
        gdprConsent: true,
        gdprConsentDate: true,
        createdAt: true,
      },
      orderBy: {
        kycSubmittedAt: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: pendingKYC,
    });
  } catch (error) {
    console.error('Get pending KYC error:', error);
    res.status(500).json({
      error: 'Failed to get pending KYC',
      message: 'An error occurred while fetching pending KYC submissions',
    });
  }
};

// Admin function to approve/reject KYC
export const reviewKYC = async (req, res) => {
  try {
    const { userId, action, rejectionReason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can access this endpoint',
      });
    }

    // Validate action
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Action must be either APPROVED or REJECTED',
      });
    }

    // Check if user exists and has pending KYC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kycStatus: true,
        identityDocument: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    if (user.kycStatus !== 'PENDING') {
      return res.status(400).json({
        error: 'Invalid KYC status',
        message: 'KYC is not in pending status',
      });
    }

    // Prepare update data
    const updateData = {
      kycStatus: action,
      kycReviewedAt: new Date(),
      kycReviewedBy: req.user.id,
    };

    if (action === 'APPROVED') {
      updateData.isVerified = true;
    } else if (action === 'REJECTED') {
      updateData.kycRejectionReason = rejectionReason || 'No reason provided';
    }

    // Update user KYC status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        kycStatus: true,
        kycReviewedAt: true,
        kycRejectionReason: true,
        isVerified: true,
      },
    });

    console.log(
      `✅ KYC ${action.toLowerCase()} for user ${userId} by admin ${req.user.id}`
    );

    res.status(200).json({
      success: true,
      message: `KYC ${action.toLowerCase()} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Review KYC error:', error);
    res.status(500).json({
      error: 'Failed to review KYC',
      message: 'An error occurred while reviewing KYC',
    });
  }
};

// Find user by email for messaging
export const findUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide an email address',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with that email address',
      });
    }

    // Don't allow users to find themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'You cannot start a conversation with yourself',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Find user by email error:', error);
    res.status(500).json({
      error: 'Failed to find user',
      message: 'An error occurred while searching for the user',
    });
  }
};

// Get user rank information
export const getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    console.log('🔍 getUserRank called:', {
      requestedUserId: userId,
      requestingUserId: requestingUserId,
      requestingUserRole: req.user.role,
    });

    // Users can view their own rank, admin can view all, landlords can view tenant ranks
    if (requestingUserId !== userId && req.user.role !== 'ADMIN') {
      // Check if this is a landlord viewing a tenant's rank
      if (req.user.role === 'LANDLORD') {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (!targetUser) {
          return res.status(404).json({
            error: 'User not found',
            message: 'The specified user does not exist',
          });
        }

        if (targetUser.role !== 'TENANT') {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Landlords can only view tenant ranks',
          });
        }
      } else {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own rank',
        });
      }
    }

    // Get user with rank information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        rank: true,
        rankPoints: true,
        totalReviews: true,
        averageRating: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    // Import rank service dynamically to avoid circular dependencies
    let rankInfo, nextRankRequirements, nextRankInfo;

    try {
      const rankService = (await import('../services/rankService.js')).default;

      // Get rank information
      rankInfo = rankService.getRankInfo(user.rank);
      nextRankRequirements = rankService.getNextRankRequirements(
        user.rank,
        user.role
      );

      if (nextRankRequirements) {
        nextRankInfo = rankService.getRankInfo(nextRankRequirements.nextRank);
      }
    } catch (rankError) {
      console.warn('Rank service error, using fallback:', rankError);
      // Fallback rank info
      rankInfo = {
        name: 'New User',
        description: 'Just getting started',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: '⭐',
        requirements: 'Complete your first review to earn a rank',
      };
      nextRankRequirements = null;
      nextRankInfo = null;
    }

    const rankData = {
      rank: user.rank,
      rankPoints: user.rankPoints || 0,
      totalReviews: user.totalReviews || 1,
      averageRating: user.averageRating || 5.0,
      rankInfo,
      nextRankRequirements: nextRankRequirements
        ? {
            ...nextRankRequirements,
            nextRankInfo,
          }
        : null,
      accountAge: Math.floor(
        (new Date() - user.createdAt) / (1000 * 60 * 60 * 24)
      ),
    };

    res.json({
      success: true,
      data: rankData,
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      error: 'Failed to get user rank',
      message: 'An error occurred while fetching user rank',
    });
  }
};

/**
 * Get user badges for display in tenant cards and other UI components
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserBadgesForDisplay = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'Please provide a valid user ID',
      });
    }

    // Get user's badges
    const userBadges = await getUserBadges(userId);

    res.json({
      success: true,
      badges: userBadges,
    });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({
      error: 'Failed to get user badges',
      message: 'An error occurred while fetching user badges',
    });
  }
};
