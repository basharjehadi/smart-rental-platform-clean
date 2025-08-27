import { prisma } from '../utils/prisma.js';

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
          organization: true
        }
      });
      
      // Update landlord availability for all members of the owning organization
      if (property.organizationId) {
        const members = await prisma.organizationMember.findMany({
          where: { organizationId: property.organizationId },
          select: { userId: true }
        });
        await Promise.all(members.map(m => this.updateLandlordAvailability(m.userId)));
      }
      
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
  async updateLandlordAvailability(landlordId) {
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
          organization: {
            members: { some: { userId: landlordId } }
          },
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
      const props = await prisma.property.findMany({
        where: {
          organization: { members: { some: { userId: landlordId } } }
        },
        select: { status: true, availability: true }
      });
      const summary = {};
      for (const p of props) {
        const key = `${p.status}_${p.availability}`;
        summary[key] = (summary[key] || 0) + 1;
      }
      
      return summary;
      
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
          status: 'AVAILABLE',
          organization: { members: { some: { userId: landlordId } } }
        },
        data: { availability, updatedAt: new Date() }
      });
      
      // Update landlord availability
      await this.updateLandlordAvailability(landlordId);
      
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
          status: 'AVAILABLE',
          availability: true,
          organization: { members: { some: { userId: landlordId } } }
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

  /**
   * 🚀 SCALABILITY: Get system-wide availability summary
   */
  async getAvailabilitySummary() {
    try {
      const summary = {};

      // Overall property counts
      const [totalProperties, availableProperties, occupiedProperties] = await Promise.all([
        prisma.property.count(),
        prisma.property.count({ where: { availability: true } }),
        prisma.property.count({ where: { availability: false } })
      ]);

      summary.properties = {
        total: totalProperties,
        available: availableProperties,
        occupied: occupiedProperties,
        utilizationRate: totalProperties > 0 ? ((occupiedProperties / totalProperties) * 100).toFixed(2) : 0
      };

      // Landlord availability
      const [totalLandlords, availableLandlords] = await Promise.all([
        prisma.user.count({ where: { role: 'LANDLORD' } }),
        prisma.user.count({ where: { role: 'LANDLORD', availability: true } })
      ]);

      summary.landlords = {
        total: totalLandlords,
        available: availableLandlords,
        availabilityRate: totalLandlords > 0 ? ((availableLandlords / totalLandlords) * 100).toFixed(2) : 0
      };

      // Recent availability changes (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentChanges = await prisma.property.count({
        where: {
          updatedAt: { gte: yesterday }
        }
      });

      summary.recentActivity = {
        propertiesUpdatedLast24h: recentChanges
      };

      return summary;
    } catch (error) {
      console.error('❌ Error getting availability summary:', error);
      throw error;
    }
  }
}

export default new PropertyAvailabilityService();
