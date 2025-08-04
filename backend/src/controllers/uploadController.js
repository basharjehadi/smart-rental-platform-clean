import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Upload profile image
export const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📤 Profile image upload request from user:', userId);

    if (!req.file) {
      console.log('❌ No file provided in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('📁 File received:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Store just the filename in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: req.file.filename },
      select: {
        id: true,
        profileImage: true,
        updatedAt: true
      }
    });

    console.log('✅ Profile image saved to database:', updatedUser.profileImage);

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error('❌ Upload profile image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete profile image
export const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user to find existing image
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true }
    });

    if (user && user.profileImage) {
      // user.profileImage is now just the filename
      const filePath = path.join('./uploads/profile_images', user.profileImage);

      // Delete file from filesystem if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update user to remove profile image
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      select: {
        id: true,
        profileImage: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile image deleted successfully',
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 