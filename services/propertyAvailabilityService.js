import prisma from '../lib/prisma.js';

/**
 * 🏠 Property Availability Service
 * Manages property availability and updates landlord availability accordingly
 */
class PropertyAvailabilityService {
  
  /**
   * Update property availability status
   */
  async updatePropertyAvailability(propertyId, availability, status = null) {
    try {
      const updateData = {
        availability,
        updatedAt: new Date()
      };
      
      if (status) {
        updateData.status = status;
      }
      
      const property = await prisma.property.update({
        where: { id: propertyId },
        data: updateData,
        include: {
          landlord: {
            select: {
              id: true,
              availability: true
            }
          }
        }
      });
      
      // Update landlord availability based on whether they have any available properties
      await this.updateUserAvailability(property.landlordId);
      
      console.log(`✅ Property ${propertyId} availability updated to ${availability}`);
      return property;
      
    } catch (error) {
      console.error('❌ Error updating property availability:', error);
      throw error;
    }
  }
  
  /**
   * Update landlord availability based on property status
   */
  async updateUserAvailability(landlordId) {
    try {
      // Check if landlord has any available properties
      const availableProperties = await prisma.property.count({
        where: {
          landlordId,
          status: 'AVAILABLE',
          availability: true
        }
      });
      
      // Update landlord availability
      await prisma.user.update({
        where: { id: landlordId },
        data: {
          availability: availableProperties > 0,
          lastActiveAt: new Date()
        }
      });
      
      console.log(`📊 Landlord ${landlordId} availability updated to ${availableProperties > 0} (${availableProperties} available properties)`);
      
    } catch (error) {
      console.error('❌ Error updating landlord availability:', error);
    }
  }
  
  /**
   * Get all available properties for a landlord
   */
  async getAvailableProperties(landlordId) {
    try {
      return await prisma.property.findMany({
        where: {
          landlordId,
          status: 'AVAILABLE',
          availability: true
        },
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      });
    } catch (error) {
      console.error('❌ Error getting available properties:', error);
      return [];
    }
  }
  
  /**
   * Get property availability summary for a landlord
   */
  async getPropertyAvailabilitySummary(landlordId) {
    try {
      const summary = await prisma.property.groupBy({
        by: ['status', 'availability'],
        where: { landlordId },
        _count: {
          id: true
        }
      });
      
      return summary.reduce((acc, item) => {
        const key = `${item.status}_${item.availability}`;
        acc[key] = item._count.id;
        return acc;
      }, {});
      
    } catch (error) {
      console.error('❌ Error getting property availability summary:', error);
      return {};
    }
  }
  
  /**
   * Bulk update property availability for a landlord
   */
  async bulkUpdatePropertyAvailability(landlordId, availability) {
    try {
      const result = await prisma.property.updateMany({
        where: {
          landlordId,
          status: 'AVAILABLE'
        },
        data: {
          availability,
          updatedAt: new Date()
        }
      });
      
      // Update landlord availability
      await this.updateUserAvailability(landlordId);
      
      console.log(`✅ Updated ${result.count} properties for landlord ${landlordId} to availability: ${availability}`);
      return result;
      
    } catch (error) {
      console.error('❌ Error bulk updating property availability:', error);
      throw error;
    }
  }
  
  /**
   * Check if landlord can accept new requests
   */
  async canLandlordAcceptRequests(landlordId) {
    try {
      const availableProperties = await prisma.property.count({
        where: {
          landlordId,
          status: 'AVAILABLE',
          availability: true
        }
      });
      
      const landlord = await prisma.user.findUnique({
        where: { id: landlordId },
        select: { availability: true }
      });
      
      return {
        canAccept: landlord?.availability && availableProperties > 0,
        availableProperties,
        landlordAvailable: landlord?.availability
      };
      
    } catch (error) {
      console.error('❌ Error checking landlord request acceptance:', error);
      return { canAccept: false, availableProperties: 0, landlordAvailable: false };
    }
  }
}

export default new PropertyAvailabilityService();
