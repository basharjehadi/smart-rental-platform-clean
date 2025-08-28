import prisma from '../lib/prisma.js';
import propertyAvailabilityService from '../services/propertyAvailabilityService.js';

// Get all properties for a landlord
export const getLandlordProperties = async (req, res) => {
  try {
    const landlordId = req.user.id;

    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlordId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      properties: properties
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

    const property = await prisma.property.findFirst({
      where: {
        id: id,
        landlordId: landlordId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.json({
      success: true,
      property: property
    });

  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
};

// Create a new property
export const createProperty = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const {
      name,
      address,
      city,
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
      maxTenants = 1,
      description,
      houseRules,
      images,
      videos
    } = req.body;

    // Validate required fields
    if (!name || !address || !city || !zipCode || !propertyType || !monthlyRent) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, city, zip code, property type, and monthly rent are required'
      });
    }

    const property = await prisma.property.create({
      data: {
        landlordId,
        name,
        address,
        city,
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
        utilitiesIncluded,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        furnished,
        parking,
        petsAllowed,
        smokingAllowed,
        maxTenants: parseInt(maxTenants),
        description,
        houseRules,
        images: images ? JSON.stringify(images) : null,
        videos: videos ? JSON.stringify(videos) : null
      }
    });

    res.status(201).json({
      success: true,
      property: property,
      message: 'Property created successfully'
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create property'
    });
  }
};

// Update a property
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const updateData = req.body;

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        landlordId: landlordId
      }
    });

    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Parse numeric fields
    if (updateData.bedrooms) updateData.bedrooms = parseInt(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = parseInt(updateData.bathrooms);
    if (updateData.size) updateData.size = parseFloat(updateData.size);
    if (updateData.floor) updateData.floor = parseInt(updateData.floor);
    if (updateData.totalFloors) updateData.totalFloors = parseInt(updateData.totalFloors);
    if (updateData.monthlyRent) updateData.monthlyRent = parseFloat(updateData.monthlyRent);
    if (updateData.depositAmount) updateData.depositAmount = parseFloat(updateData.depositAmount);

    // Parse date fields
    if (updateData.availableFrom) updateData.availableFrom = new Date(updateData.availableFrom);
    if (updateData.availableUntil) updateData.availableUntil = new Date(updateData.availableUntil);

    // Parse JSON fields
    if (updateData.images) updateData.images = JSON.stringify(updateData.images);
    if (updateData.videos) updateData.videos = JSON.stringify(updateData.videos);

    const property = await prisma.property.update({
      where: {
        id: id
      },
      data: updateData
    });

    // Update landlord availability based on property changes
    await propertyAvailabilityService.updateUserAvailability(landlordId);

    res.json({
      success: true,
      property: property,
      message: 'Property updated successfully'
    });

  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update property'
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
        landlordId: landlordId
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
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RENTED', 'UNAVAILABLE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: AVAILABLE, OCCUPIED, MAINTENANCE, RENTED, UNAVAILABLE'
      });
    }

    // Check if property exists and belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id: id,
        landlordId: landlordId
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

// Update property availability
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
        landlordId: landlordId
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

// Get property availability summary
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