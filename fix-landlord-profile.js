import prisma from './lib/prisma.js';

const fixLandlordProfile = async () => {
  try {
    console.log('🔧 Fixing landlord profile...\n');
    
    // Update landlord profile to have proper JSON strings
    const updatedProfile = await prisma.landlordProfile.update({
      where: { userId: 'cmdr7oyu40000ex7g9n56mcwz' }, // Anna Landlord's ID
      data: {
        propertyImages: '[]', // Empty JSON array as string
        propertyVideos: '[]', // Empty JSON array as string
        preferredLocations: '["Warszawa", "Mokotów"]', // JSON array as string
        propertyTypes: '["APARTMENT"]', // JSON array as string
        amenities: '["PARKING", "BALCONY", "ELEVATOR"]' // JSON array as string
      }
    });
    
    console.log('✅ Landlord profile updated successfully');
    console.log('Updated profile:', {
      propertyImages: updatedProfile.propertyImages,
      propertyVideos: updatedProfile.propertyVideos,
      preferredLocations: updatedProfile.preferredLocations,
      propertyTypes: updatedProfile.propertyTypes,
      amenities: updatedProfile.amenities
    });
    
  } catch (error) {
    console.error('❌ Error updating landlord profile:', error);
  } finally {
    await prisma.$disconnect();
  }
};

fixLandlordProfile(); 