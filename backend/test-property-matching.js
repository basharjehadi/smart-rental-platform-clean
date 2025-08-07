import { prisma } from './src/utils/prisma.js';

async function testPropertyMatching() {
  try {
    console.log('Testing property matching logic...');
    
    // Get a sample landlord
    const landlord = await prisma.user.findFirst({
      where: { role: 'LANDLORD' }
    });
    
    if (!landlord) {
      console.log('No landlord found');
      return;
    }
    
    console.log('Landlord:', landlord.id);
    
    // Get landlord's properties
    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlord.id,
        status: 'AVAILABLE'
      }
    });
    
         console.log('Properties found:', properties.length);
     properties.forEach(p => {
       console.log(`- ${p.name}: ${p.address}, ${p.zipCode || 'N/A'}, ${p.city}, ${p.monthlyRent} zł`);
     });
    
    // Get rental requests
    const requests = await prisma.rentalRequest.findMany({
      where: {
        poolStatus: 'ACTIVE',
        status: 'ACTIVE'
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('Rental requests found:', requests.length);
    requests.forEach(r => {
      console.log(`- Request ${r.id}: ${r.location}, ${r.budgetFrom}-${r.budgetTo} zł, ${r.propertyType}`);
    });
    
    // Test matching logic
    requests.forEach(request => {
      console.log(`\nMatching request ${request.id}:`);
      
      const matchedProperty = properties.find(property => {
        const locationMatch = request.location.toLowerCase().includes(property.city.toLowerCase());
        const budgetMatch = request.budgetFrom <= property.monthlyRent * 1.2 && 
                           request.budgetTo >= property.monthlyRent * 0.8;
        
        console.log(`  Property ${property.id}: location=${locationMatch}, budget=${budgetMatch}`);
        
        return locationMatch && budgetMatch;
      });
      
             if (matchedProperty) {
         console.log(`  ✅ Matched: ${matchedProperty.name} - ${matchedProperty.address}, ${matchedProperty.zipCode || 'N/A'}, ${matchedProperty.city}`);
       } else {
         console.log(`  ❌ No match found`);
       }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPropertyMatching(); 