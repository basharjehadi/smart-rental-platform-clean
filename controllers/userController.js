import { PrismaClient } from '@prisma/client';

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
        signatureBase64: true
      }
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
        dowodOsobistyNumber: true,
        address: true,
        profileImage: true,
        signatureBase64: true,
        identityDocument: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      dowodOsobistyNumber,
      address,
      profileImage
    } = req.body;

    // Validate required fields based on role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};

    // Common fields for all users
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    if (user.role === 'TENANT') {
      // Tenant-specific fields
      if (pesel !== undefined) updateData.pesel = pesel;
      if (passportNumber !== undefined) updateData.passportNumber = passportNumber;
      if (kartaPobytuNumber !== undefined) updateData.kartaPobytuNumber = kartaPobytuNumber;
      if (address !== undefined) updateData.address = address; // Allow address for tenants too
    } else if (user.role === 'LANDLORD') {
      // Landlord-specific fields
      if (dowodOsobistyNumber !== undefined) updateData.dowodOsobistyNumber = dowodOsobistyNumber;
      if (address !== undefined) updateData.address = address;
    }

    // Validate PESEL format (11 digits)
    if (updateData.pesel && !/^\d{11}$/.test(updateData.pesel)) {
      return res.status(400).json({ error: 'PESEL must be exactly 11 digits' });
    }

    // Validate phone number format (basic validation)
    if (updateData.phoneNumber && !/^[\+]?[0-9\s\-\(\)]{9,15}$/.test(updateData.phoneNumber)) {
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
        dowodOsobistyNumber: true,
        address: true,
        profileImage: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
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
      address
    } = req.body;

    // Validate required fields based on role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};

    if (user.role === 'TENANT') {
      // Tenant-specific validation
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required for tenants' });
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
        return res.status(400).json({ error: 'First name and last name are required for landlords' });
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
        address: true
      }
    });

    res.json({
      message: 'Identity data updated successfully',
      user: updatedUser
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
        signatureBase64: true
      }
    });

    res.json({
      message: 'Signature saved successfully',
      user: updatedUser
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
            landlord: true
          }
        }
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is tenant or landlord
    const isTenant = rentalRequest.tenantId === userId;
    const isLandlord = rentalRequest.offer?.landlordId === userId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ error: 'Unauthorized to sign this contract' });
    }

    // Create or update contract signature
    const contractSignature = await prisma.contractSignature.upsert({
      where: { rentalRequestId },
      update: {
        tenantSignatureBase64: isTenant ? tenantSignatureBase64 : undefined,
        landlordSignatureBase64: isLandlord ? landlordSignatureBase64 : undefined,
        signedAt: new Date()
      },
      create: {
        rentalRequestId,
        tenantSignatureBase64: isTenant ? tenantSignatureBase64 : null,
        landlordSignatureBase64: isLandlord ? landlordSignatureBase64 : null
      }
    });

    res.json({
      message: 'Contract signatures saved successfully',
      contractSignature
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
            landlord: true
          }
        }
      }
    });

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    // Check if user is tenant or landlord
    const isTenant = rentalRequest.tenantId === userId;
    const isLandlord = rentalRequest.offer?.landlordId === userId;

    if (!isTenant && !isLandlord) {
      return res.status(403).json({ error: 'Unauthorized to view this contract' });
    }

    const contractSignature = await prisma.contractSignature.findUnique({
      where: { rentalRequestId }
    });

    res.json({
      contractSignature,
      userRole: isTenant ? 'TENANT' : 'LANDLORD'
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
        message: 'Please select a file to upload'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and PDF files are allowed'
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }

    // Get the filename from the uploaded file
    const filename = req.file.filename;
    const filePath = `uploads/identity_documents/${filename}`;

    // Update user record with identity document filename
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        identityDocument: filename
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identityDocument: true,
        updatedAt: true
      }
    });

    console.log(`✅ Identity document uploaded for user ${userId}: ${filename}`);

    res.status(200).json({
      success: true,
      message: 'Identity document uploaded successfully',
      data: {
        filename: filename,
        filePath: filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Upload identity document error:', error);
    res.status(500).json({
      error: 'Failed to upload identity document',
      message: 'An error occurred while processing your upload'
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
        address: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Define required fields for different user roles
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