import { prisma } from '../utils/prisma.js';
import propertyAvailabilityService from '../services/propertyAvailabilityService.js';

// Get all properties for a landlord
export const getLandlordProperties = async (req, res) => {
  try {
    const landlordId = req.user.id;

    const properties = await prisma.property.findMany({
      where: {
        // Properties owned by an organization where the current user is a member
        organization: {
          members: {
            some: { userId: landlordId }
          }
        }
      },
      include: {
        offers: {
          where: { status: 'PAID' },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            moveInVerificationStatus: true,
            moveInVerificationDeadline: true,
            moveInVerificationDate: true,
            rentalRequest: { select: { moveInDate: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Shape with inline move-in status for quick UI
    const shaped = properties.map(p => {
      const latest = (p.offers && p.offers[0]) || null;
      const deadline = latest?.moveInVerificationDeadline || (latest?.rentalRequest?.moveInDate
        ? new Date(new Date(latest.rentalRequest.moveInDate).getTime() + 24 * 60 * 60 * 1000)
        : null);
      const { offers, ...rest } = p;
      return {
        ...rest,
        _moveIn: latest ? {
          offerId: latest.id,
          status: latest.moveInVerificationStatus,
          deadline,
          verifiedAt: latest.moveInVerificationDate
        } : null
      };
    });

    res.json({
      success: true,
      properties: shaped
    });

  } catch (error) {
    console.error('Get landlord properties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties'
    });
  }
};

// Get a single property by ID
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    console.log('🔍 Fetching property by ID:', id, 'for landlord:', landlordId);

    const property = await prisma.property.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: { userId: landlordId }
          }
        }
      }
    });

    if (!property) {
      console.log('❌ Property not found');
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    console.log('✅ Property found:', {
      id: property.id,
      name: property.name,
      houseRules: property.houseRules,
      images: property.images,
      videos: property.videos
    });

    res.json({
      success: true,
      property: property
    });

  } catch (error) {
    console.error('❌ Get property by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
};

// Create a new property
export const createProperty = async (req, res) => {
  try {
    console.log('🔍 Property creation request received');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request files:', req.files);
    console.log('👤 User ID:', req.user.id);
    
    const landlordId = req.user.id;
    const {
      name,
      address,
      city,
      district,
      zipCode,
      country = 'Poland',
      propertyType,
      bedrooms,
      bathrooms,
      size,
      floor,
      totalFloors,
      monthlyRent,
      depositAmount,
      utilitiesIncluded = false,
      availableFrom,
      availableUntil,
      furnished = false,
      parking = false,
      petsAllowed = false,
      smokingAllowed = false,
      description,
      houseRules
    } = req.body;

    // Validate required fields
    if (!name || !address || !city || !zipCode || !propertyType || !monthlyRent || !availableFrom) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, city, zip code, property type, monthly rent, and available from date are required'
      });
    }

    // Validate required files
    if (!req.files || !req.files.propertyVideo) {
      return res.status(400).json({
        success: false,
        error: 'Virtual tour video is required'
      });
    }

    if (!req.files.propertyImages || req.files.propertyImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one property photo is required'
      });
    }

    // Handle uploaded files
    let imageUrls = [];
    let videoUrls = [];

    console.log('📁 Processing uploaded files...');
    console.log('📁 req.files:', req.files);

    if (req.files) {
      // Handle property images
      if (req.files.propertyImages) {
        console.log('📸 Processing property images:', req.files.propertyImages);
        imageUrls = req.files.propertyImages.map(file => {
          const url = `/uploads/property_images/${file.filename}`;
          console.log('📸 Image URL:', url);
          return url;
        });
      }
      
      // Handle property videos
      if (req.files.propertyVideo) {
        console.log('🎥 Processing property videos:', req.files.propertyVideo);
        videoUrls = req.files.propertyVideo.map(file => {
          const url = `/uploads/property_videos/${file.filename}`;
          console.log('🎥 Video URL:', url);
          return url;
        });
      }
    }

    console.log('📁 Final image URLs:', imageUrls);
    console.log('📁 Final video URLs:', videoUrls);

    console.log('💾 Creating property in database...');
    console.log('💾 Data to be inserted:', {
      landlordId,
      name,
      address,
      city,
      district,
      zipCode,
      country,
      propertyType,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      size: size ? parseFloat(size) : null,
      floor: floor ? parseInt(floor) : null,
      totalFloors: totalFloors ? parseInt(totalFloors) : null,
      monthlyRent: parseFloat(monthlyRent),
      depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      utilitiesIncluded: utilitiesIncluded === 'true' || utilitiesIncluded === true,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      furnished: furnished === 'true' || furnished === true,
      parking: parking === 'true' || parking === true,
      petsAllowed: petsAllowed === 'true' || petsAllowed === true,
      smokingAllowed: smokingAllowed === 'true' || smokingAllowed === true,
      availability: true, // New property is available by default
      description,
      houseRules,
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      videos: videoUrls.length > 0 ? JSON.stringify(videoUrls) : null
    });

    console.log('🏠 Amenities/houseRules being saved:', houseRules);
    console.log('🏠 Amenities type:', typeof houseRules);

    // Resolve the organization for this user; if none, auto-provision a personal org
    let orgMember = await prisma.organizationMember.findFirst({
      where: { userId: landlordId },
      include: { organization: true }
    });

    if (!orgMember) {
      const user = await prisma.user.findUnique({
        where: { id: landlordId },
        select: { id: true, name: true, email: true }
      });

      const orgName = user?.name ? `${user.name} Personal` : `Personal Organization (${user?.email || landlordId})`;
      const organization = await prisma.organization.create({
        data: {
          name: orgName,
          taxId: null,
          regNumber: null,
          address: null,
          signatureBase64: null
        }
      });

      orgMember = await prisma.organizationMember.create({
        data: {
          userId: landlordId,
          organizationId: organization.id,
          role: 'OWNER'
        },
        include: { organization: true }
      });
    }

    const property = await prisma.property.create({
      data: {
        organizationId: orgMember.organization.id,
        name,
        address,
        city,
        district,
        zipCode,
        country,
        propertyType,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        size: size ? parseFloat(size) : null,
        floor: floor ? parseInt(floor) : null,
        totalFloors: totalFloors ? parseInt(totalFloors) : null,
        monthlyRent: parseFloat(monthlyRent),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        utilitiesIncluded: utilitiesIncluded === 'true' || utilitiesIncluded === true,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        furnished: furnished === 'true' || furnished === true,
        parking: parking === 'true' || parking === true,
        petsAllowed: petsAllowed === 'true' || petsAllowed === true,
        smokingAllowed: smokingAllowed === 'true' || smokingAllowed === true,
        availability: true, // New property is available by default
        description,
        houseRules,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        videos: videoUrls.length > 0 ? JSON.stringify(videoUrls) : null
      }
    });

    console.log('✅ Property created successfully:', property.id);

    // Update landlord availability based on new property
    await propertyAvailabilityService.updateLandlordAvailability(landlordId);

    res.status(201).json({
      success: true,
      property: property,
      message: 'Property created successfully'
    });

  } catch (error) {
    console.error('Create property error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
    // Send more detailed error information
    res.status(500).json({
      success: false,
      error: 'Failed to create property',
      details: error.message,
      code: error.code
    });
  }
};

// Update a property
export const updateProperty = async (req, res) => {
  try {
    console.log('🔍 Property update request received');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request files:', req.files);
    console.log('👤 User ID:', req.user.id);
    
    const { id } = req.params;
    const landlordId = req.user.id;
    const updateData = { ...req.body };

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: { userId: landlordId }
          }
        }
      }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // --- Media Handling ---
    let finalImages = [];
    let finalVideos = [];

    // 1. Start with retained images/videos from frontend (these are the ones the user wants to keep)
    if (updateData.retainedImageUrls) {
      try {
        finalImages = JSON.parse(updateData.retainedImageUrls);
        console.log('📸 Retained images:', finalImages);
      } catch (e) {
        console.error('Error parsing retainedImageUrls:', e);
        finalImages = [];
      }
      delete updateData.retainedImageUrls; // Remove from updateData as it's handled
    }

    if (updateData.retainedVideoUrl) {
      finalVideos = [updateData.retainedVideoUrl];
      console.log('🎥 Retained video:', finalVideos);
      delete updateData.retainedVideoUrl; // Remove from updateData as it's handled
    }

    // 2. Add newly uploaded files (multer field names: propertyVideo, propertyImages)
    if (req.files) {
      // Some multer configs provide single file as req.file, ensure arrays exist
      req.files.propertyVideo = req.files.propertyVideo || (req.files['propertyVideo'] || []);
      req.files.propertyImages = req.files.propertyImages || (req.files['propertyImages'] || []);
      
      if (req.files.propertyVideo && req.files.propertyVideo.length > 0) {
        // If a new video is uploaded, it replaces any retained/old video
        finalVideos = [`/uploads/property_videos/${req.files.propertyVideo[0].filename}`];
        console.log('🎥 New video uploaded:', finalVideos);
      }
      
      if (req.files.propertyImages && req.files.propertyImages.length > 0) {
        const newImageFilenames = req.files.propertyImages.map(file => `/uploads/property_images/${file.filename}`);
        finalImages = [...finalImages, ...newImageFilenames]; // Append new images
        console.log('📸 New images uploaded:', newImageFilenames);
      }
    }

    // Update the images and videos fields in updateData
    // Preserve existing arrays if nothing retained or uploaded
    if (finalImages.length === 0 && existingProperty.images) {
      try { finalImages = JSON.parse(existingProperty.images) || []; } catch {}
    }
    if (finalVideos.length === 0 && existingProperty.videos) {
      try { finalVideos = JSON.parse(existingProperty.videos) || []; } catch {}
    }

    updateData.images = finalImages.length > 0 ? JSON.stringify(finalImages) : null;
    updateData.videos = finalVideos.length > 0 ? JSON.stringify(finalVideos) : null;
    console.log('📸 Final images:', finalImages);
    console.log('🎥 Final videos:', finalVideos);
    // --- End Media Handling ---

    // Parse numeric fields
    if (updateData.bedrooms) updateData.bedrooms = parseInt(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = parseInt(updateData.bathrooms);
    if (updateData.size) updateData.size = parseFloat(updateData.size);
    if (updateData.floor) updateData.floor = parseInt(updateData.floor);
    if (updateData.totalFloors) updateData.totalFloors = parseInt(updateData.totalFloors);
    if (updateData.monthlyRent) updateData.monthlyRent = parseFloat(updateData.monthlyRent);
    if (updateData.depositAmount) updateData.depositAmount = parseFloat(updateData.depositAmount);

    // Parse boolean fields
    if (updateData.furnished !== undefined) updateData.furnished = updateData.furnished === 'true';
    if (updateData.parking !== undefined) updateData.parking = updateData.parking === 'true';
    if (updateData.petsAllowed !== undefined) updateData.petsAllowed = updateData.petsAllowed === 'true';
    if (updateData.smokingAllowed !== undefined) updateData.smokingAllowed = updateData.smokingAllowed === 'true';
    if (updateData.utilitiesIncluded !== undefined) updateData.utilitiesIncluded = updateData.utilitiesIncluded === 'true';

    // Handle amenities (houseRules)
    if (updateData.houseRules) {
      // Frontend sends it as JSON string, so no need to stringify if it's already a string
      // But if it's an empty string, it means no amenities, so set to '[]'
      if (typeof updateData.houseRules === 'string' && updateData.houseRules.length === 0) {
        updateData.houseRules = '[]';
      }
    } else {
      updateData.houseRules = '[]'; // If not provided, set to empty array JSON string
    }

    // Parse date fields
    if (updateData.availableFrom) updateData.availableFrom = new Date(updateData.availableFrom);
    if (updateData.availableUntil) updateData.availableUntil = new Date(updateData.availableUntil);

    console.log('📝 Final update data:', updateData);
    console.log('🏠 Amenities/houseRules being updated:', updateData.houseRules);

    const property = await prisma.property.update({
      where: {
        id: id
      },
      data: updateData
    });

    console.log('✅ Property updated successfully:', property.id);

    // Update landlord availability based on property changes
    await propertyAvailabilityService.updateLandlordAvailability(landlordId);

    res.json({
      success: true,
      property: property,
      message: 'Property updated successfully'
    });

  } catch (error) {
    console.error('❌ Update property error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update property',
      details: error.message,
      code: error.code
    });
  }
};

// Delete a property
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: { userId: landlordId }
          }
        }
      }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    await prisma.property.delete({
      where: {
        id: id
      }
    });

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property'
    });
  }
};

// Update property status
export const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const landlordId = req.user.id;

    // Validate status
    const validStatuses = ['AVAILABLE', 'RENTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: AVAILABLE, RENTED'
      });
    }

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: { userId: landlordId }
          }
        }
      }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Update property status and availability
    const property = await propertyAvailabilityService.updatePropertyAvailability(
      id, 
      status === 'AVAILABLE', // availability is true only if status is AVAILABLE
      status
    );

    res.json({
      success: true,
      property: property,
      message: 'Property status updated successfully'
    });

  } catch (error) {
    console.error('Update property status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update property status'
    });
  }
};

// NEW: Update property availability
export const updatePropertyAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    const landlordId = req.user.id;

    // Validate availability
    if (typeof availability !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Availability must be a boolean value'
      });
    }

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        organization: {
          members: {
            some: { userId: landlordId }
          }
        }
      }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Update property availability
    const property = await propertyAvailabilityService.updatePropertyAvailability(id, availability);

    res.json({
      success: true,
      property: property,
      message: 'Property availability updated successfully'
    });

  } catch (error) {
    console.error('Update property availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update property availability'
    });
  }
};

// NEW: Get property availability summary
export const getPropertyAvailabilitySummary = async (req, res) => {
  try {
    const landlordId = req.user.id;

    const summary = await propertyAvailabilityService.getPropertyAvailabilitySummary(landlordId);
    const availableProperties = await propertyAvailabilityService.getAvailableProperties(landlordId);
    const canAcceptRequests = await propertyAvailabilityService.canLandlordAcceptRequests(landlordId);

    res.json({
      success: true,
      summary,
      availableProperties,
      canAcceptRequests
    });

  } catch (error) {
    console.error('Get property availability summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get property availability summary'
    });
  }
};