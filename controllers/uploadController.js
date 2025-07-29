import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Upload profile image
export const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Generate the file URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Update user profile with new image URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: fileUrl },
      select: {
        id: true,
        profileImage: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
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
      // Extract filename from URL
      const filename = user.profileImage.split('/').pop();
      const filePath = path.join('./uploads', filename);

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