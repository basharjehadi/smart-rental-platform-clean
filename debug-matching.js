import prisma from './lib/prisma.js';

const debugMatching = async () => {
  try {
    console.log('🔍 Debugging request matching...\n');
    
    // Check rental requests
    const rentalRequests = await prisma.rentalRequest.findMany({
      where: { poolStatus: 'ACTIVE' },
      select: {
        id: true,
        location: true,
        budget: true,
        poolStatus: true,
        createdAt: true
      }
    });
    
    console.log('📋 Active rental requests:', rentalRequests);
    
    // Check landlord profile
    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: 'cmdr7oyu40000ex7g9n56mcwz' }, // Anna Landlord
      select: {
        preferredLocations: true,
        maxBudget: true,
        minBudget: true,
        maxTenants: true,
        currentTenants: true,
        manualAvailability: true,
        autoAvailability: true
      }
    });
    
    console.log('🏠 Landlord profile:', landlordProfile);
    
    // Check landlord user data
    const landlord = await prisma.user.findUnique({
      where: { id: 'cmdr7oyu40000ex7g9n56mcwz' },
      select: {
        id: true,
        role: true,
        availability: true,
        autoAvailability: true,
        currentTenants: true,
        maxTenants: true
      }
    });
    
    console.log('👤 Landlord user data:', landlord);
    
    // Check if any matches exist
    const matches = await prisma.landlordRequestMatch.findMany({
      where: { landlordId: 'cmdr7oyu40000ex7g9n56mcwz' },
      include: {
        rentalRequest: {
          select: {
            id: true,
            location: true,
            budget: true
          }
        }
      }
    });
    
    console.log('🔗 Existing matches:', matches);
    
    // Test location matching manually
    if (rentalRequests.length > 0 && landlordProfile) {
      const request = rentalRequests[0];
      console.log('\n🧪 Testing location matching:');
      console.log('Request location:', request.location);
      console.log('Landlord preferred locations:', landlordProfile.preferredLocations);
      
      try {
        const preferredLocations = JSON.parse(landlordProfile.preferredLocations);
        console.log('Parsed preferred locations:', preferredLocations);
        
        const locationMatch = preferredLocations.some(loc => 
          request.location.includes(loc) || loc.includes(request.location)
        );
        
        console.log('Location match:', locationMatch);
        
        // Test budget matching
        const budgetMatch = !landlordProfile.maxBudget || request.budget <= landlordProfile.maxBudget;
        console.log('Budget match:', budgetMatch);
        
        // Test capacity matching
        const capacityMatch = landlord.currentTenants < landlord.maxTenants;
        console.log('Capacity match:', capacityMatch);
        
        // Test availability matching
        const availabilityMatch = landlord.availability && landlord.autoAvailability;
        console.log('Availability match:', availabilityMatch);
        
        console.log('Overall should match:', locationMatch && budgetMatch && capacityMatch && availabilityMatch);
        
      } catch (error) {
        console.log('❌ Error parsing preferred locations:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging matching:', error);
  } finally {
    await prisma.$disconnect();
  }
};

debugMatching(); 