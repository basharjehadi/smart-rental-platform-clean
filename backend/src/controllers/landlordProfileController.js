import { prisma } from '../utils/prisma.js';

/**
 * 🏠 Get landlord profile with all settings
 */
export const getLandlordProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;

    let profile = await prisma.landlordProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            availability: true,
            autoAvailability: true,
            maxTenants: true,
            currentTenants: true
          }
        }
      }
    });

    // If profile doesn't exist, create a default one
    if (!profile) {
      profile = await prisma.landlordProfile.create({
        data: {
          userId,
          maxTenants: 5,
          currentTenants: 0,
          manualAvailability: true,
          autoAvailability: true,
          autoFillMedia: true,
          autoFillRules: true,
          autoFillDescription: true,
          preferredLocations: JSON.stringify([]),
          propertyTypes: JSON.stringify([]),
          amenities: JSON.stringify([]),
          propertyImages: JSON.stringify([]),
          propertyVideos: JSON.stringify([])
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              availability: true,
              autoAvailability: true,
              maxTenants: true,
              currentTenants: true
            }
          }
        }
      });
    }

    // Parse JSON fields
    const parsedProfile = {
      ...profile,
      preferredLocations: profile.preferredLocations ? JSON.parse(profile.preferredLocations) : [],
      propertyTypes: profile.propertyTypes ? JSON.parse(profile.propertyTypes) : [],
      amenities: profile.amenities ? JSON.parse(profile.amenities) : [],
      propertyImages: profile.propertyImages ? JSON.parse(profile.propertyImages) : [],
      propertyVideos: profile.propertyVideos ? JSON.parse(profile.propertyVideos) : [],
      autoFillMedia: profile.autoFillMedia
    };

    res.json({
      message: 'Landlord profile retrieved successfully',
      profile: parsedProfile
    });

  } catch (error) {
    console.error('❌ Error getting landlord profile:', error);
    res.status(500).json({
      message: 'Failed to retrieve landlord profile',
      error: error.message
    });
  }
};

/**
 * 🏠 Create or update landlord profile
 */
export const updateLandlordProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      preferredLocations,
      maxBudget,
      minBudget,
      maxTenants,
      manualAvailability,
      autoAvailability,
      propertyTypes,
      amenities,
      propertyRules,
      propertyDescription,
      autoFillMedia,
      autoFillRules,
      autoFillDescription
    } = req.body;

    // Validate required fields
    if (!preferredLocations || preferredLocations.length === 0) {
      return res.status(400).json({
        message: 'At least one preferred location is required'
      });
    }

    if (maxTenants && maxTenants < 1) {
      return res.status(400).json({
        message: 'Maximum tenants must be at least 1'
      });
    }

    // Prepare data for database
    const profileData = {
      preferredLocations: JSON.stringify(preferredLocations),
      maxBudget: maxBudget ? parseFloat(maxBudget) : null,
      minBudget: minBudget ? parseFloat(minBudget) : null,
      maxTenants: maxTenants ? parseInt(maxTenants) : 5,
      manualAvailability: manualAvailability !== undefined ? manualAvailability : true,
      autoAvailability: autoAvailability !== undefined ? autoAvailability : true,
      propertyTypes: propertyTypes ? JSON.stringify(propertyTypes) : null,
      amenities: amenities ? JSON.stringify(amenities) : null,
      propertyRules: propertyRules || null,
      propertyDescription: propertyDescription || null,
      autoFillMedia: autoFillMedia !== undefined ? autoFillMedia : true,
      autoFillRules: autoFillRules !== undefined ? autoFillRules : true,
      autoFillDescription: autoFillDescription !== undefined ? autoFillDescription : true
    };

    // Update or create landlord profile
    const profile = await prisma.landlordProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        ...profileData,
        userId
      }
    });

    // Update user availability based on capacity
    await updateUserAvailability(userId, profile.maxTenants, profile.manualAvailability, profile.autoAvailability);

    res.json({
      message: 'Landlord profile updated successfully',
      profile: {
        ...profile,
        preferredLocations: JSON.parse(profile.preferredLocations),
        propertyTypes: profile.propertyTypes ? JSON.parse(profile.propertyTypes) : [],
        amenities: profile.amenities ? JSON.parse(profile.amenities) : [],
        propertyImages: profile.propertyImages ? JSON.parse(profile.propertyImages) : [],
        propertyVideos: profile.propertyVideos ? JSON.parse(profile.propertyVideos) : []
      }
    });

  } catch (error) {
    console.error('❌ Error updating landlord profile:', error);
    res.status(500).json({
      message: 'Failed to update landlord profile',
      error: error.message
    });
  }
};

/**
 * 🖼️ Upload property images to media library
 */
export const uploadPropertyImages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { images } = req.body; // Array of image URLs

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        message: 'Images array is required'
      });
    }

    const profile = await prisma.landlordProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: 'Landlord profile not found'
      });
    }

    // Get existing images and add new ones
    const existingImages = profile.propertyImages ? JSON.parse(profile.propertyImages) : [];
    const updatedImages = [...existingImages, ...images];

    await prisma.landlordProfile.update({
      where: { userId },
      data: {
        propertyImages: JSON.stringify(updatedImages)
      }
    });

    res.json({
      message: 'Property images uploaded successfully',
      images: updatedImages
    });

  } catch (error) {
    console.error('❌ Error uploading property images:', error);
    res.status(500).json({
      message: 'Failed to upload property images',
      error: error.message
    });
  }
};

/**
 * 🎥 Upload property videos to media library
 */
export const uploadPropertyVideos = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { videos } = req.body; // Array of video URLs

    if (!videos || !Array.isArray(videos)) {
      return res.status(400).json({
        message: 'Videos array is required'
      });
    }

    const profile = await prisma.landlordProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: 'Landlord profile not found'
      });
    }

    // Get existing videos and add new ones
    const existingVideos = profile.propertyVideos ? JSON.parse(profile.propertyVideos) : [];
    const updatedVideos = [...existingVideos, ...videos];

    await prisma.landlordProfile.update({
      where: { userId },
      data: {
        propertyVideos: JSON.stringify(updatedVideos)
      }
    });

    res.json({
      message: 'Property videos uploaded successfully',
      videos: updatedVideos
    });

  } catch (error) {
    console.error('❌ Error uploading property videos:', error);
    res.status(500).json({
      message: 'Failed to upload property videos',
      error: error.message
    });
  }
};

/**
 * 🗑️ Delete property images from media library
 */
export const deletePropertyImages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { images } = req.body; // Array of image URLs to keep (filtered array)

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        message: 'Images array is required'
      });
    }

    const profile = await prisma.landlordProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: 'Landlord profile not found'
      });
    }

    // Replace the entire images array with the filtered one
    await prisma.landlordProfile.update({
      where: { userId },
      data: {
        propertyImages: JSON.stringify(images)
      }
    });

    res.json({
      message: 'Property images deleted successfully',
      images: images
    });

  } catch (error) {
    console.error('❌ Error deleting property images:', error);
    res.status(500).json({
      message: 'Failed to delete property images',
      error: error.message
    });
  }
};

/**
 * 🗑️ Delete property videos from media library
 */
export const deletePropertyVideos = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { videos } = req.body; // Array of video URLs to keep (filtered array)

    if (!videos || !Array.isArray(videos)) {
      return res.status(400).json({
        message: 'Videos array is required'
      });
    }

    const profile = await prisma.landlordProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        message: 'Landlord profile not found'
      });
    }

    // Replace the entire videos array with the filtered one
    await prisma.landlordProfile.update({
      where: { userId },
      data: {
        propertyVideos: JSON.stringify(videos)
      }
    });

    res.json({
      message: 'Property videos deleted successfully',
      videos: videos
    });

  } catch (error) {
    console.error('❌ Error deleting property videos:', error);
    res.status(500).json({
      message: 'Failed to delete property videos',
      error: error.message
    });
  }
};

/**
 * 🎛️ Toggle landlord availability
 */
export const toggleAvailability = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { manualAvailability } = req.body;

    if (manualAvailability === undefined) {
      return res.status(400).json({
        message: 'Manual availability status is required'
      });
    }

    // Update user availability
    await prisma.user.update({
      where: { id: userId },
      data: {
        availability: manualAvailability
      }
    });

    // Update landlord profile
    await prisma.landlordProfile.update({
      where: { userId },
      data: {
        manualAvailability
      }
    });

    res.json({
      message: `Landlord availability ${manualAvailability ? 'enabled' : 'disabled'} successfully`,
      availability: manualAvailability
    });

  } catch (error) {
    console.error('❌ Error toggling availability:', error);
    res.status(500).json({
      message: 'Failed to toggle availability',
      error: error.message
    });
  }
};

/**
 * 📊 Get landlord capacity and availability status
 */
export const getCapacityStatus = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        availability: true,
        autoAvailability: true,
        maxTenants: true,
        currentTenants: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const isAvailable = user.availability && (user.currentTenants < user.maxTenants || !user.autoAvailability);

    res.json({
      message: 'Capacity status retrieved successfully',
      capacity: {
        maxTenants: user.maxTenants,
        currentTenants: user.currentTenants,
        availableSlots: Math.max(0, user.maxTenants - user.currentTenants),
        isAvailable,
        manualAvailability: user.availability,
        autoAvailability: user.autoAvailability
      }
    });

  } catch (error) {
    console.error('❌ Error getting capacity status:', error);
    res.status(500).json({
      message: 'Failed to get capacity status',
      error: error.message
    });
  }
};

/**
 * 🔄 Helper function to update user availability based on capacity
 */
async function updateUserAvailability(userId, maxTenants, manualAvailability, autoAvailability) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentTenants: true }
    });

    if (!user) return;

    // Calculate availability based on capacity and settings
    let shouldBeAvailable = manualAvailability;
    
    if (autoAvailability) {
      shouldBeAvailable = shouldBeAvailable && (user.currentTenants < maxTenants);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        availability: shouldBeAvailable,
        maxTenants,
        autoAvailability
      }
    });

  } catch (error) {
    console.error('❌ Error updating user availability:', error);
  }
} 