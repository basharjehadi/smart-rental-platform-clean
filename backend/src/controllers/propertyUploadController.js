import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Upload property images
export const uploadPropertyImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images uploaded',
      });
    }

    const imageUrls = req.files.map((file) => {
      // Return the relative path for storage in database
      return `/uploads/property_images/${file.filename}`;
    });

    res.json({
      message: 'Images uploaded successfully',
      imageUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    console.error('Upload property images error:', error);
    res.status(500).json({
      error: 'Failed to upload images',
    });
  }
};

// Upload property video
export const uploadPropertyVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No video uploaded',
      });
    }

    const videoUrl = `/uploads/property_videos/${req.file.filename}`;

    res.json({
      message: 'Video uploaded successfully',
      videoUrl,
    });
  } catch (error) {
    console.error('Upload property video error:', error);
    res.status(500).json({
      error: 'Failed to upload video',
    });
  }
};

// Delete property file
export const deletePropertyFile = async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        error: 'File URL is required',
      });
    }

    // Remove the leading slash to get the file path
    const filePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    const fullPath = path.join(process.cwd(), filePath);

    // Check if file exists
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete property file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
    });
  }
};

// Get file info (for validation)
export const getFileInfo = async (req, res) => {
  try {
    const { fileUrl } = req.params;

    if (!fileUrl) {
      return res.status(400).json({
        error: 'File URL is required',
      });
    }

    // Remove the leading slash to get the file path
    const filePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    const fullPath = path.join(process.cwd(), filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'File not found',
      });
    }

    const stats = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    res.json({
      exists: true,
      size: stats.size,
      extension: ext,
      isImage: ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext),
      isVideo: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext),
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      error: 'Failed to get file info',
    });
  }
};
