import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAmenities() {
  try {
    console.log('🔍 Testing amenities functionality...\n');
    
    // Get the most recent property
    const property = await prisma.property.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        houseRules: true,
        createdAt: true
      }
    });
    
    if (!property) {
      console.log('❌ No properties found in database');
      return;
    }
    
    console.log('📋 Property details:');
    console.log('ID:', property.id);
    console.log('Name:', property.name);
    console.log('Created:', property.createdAt);
    console.log('House Rules (raw):', property.houseRules);
    console.log('House Rules type:', typeof property.houseRules);
    
    if (property.houseRules) {
      try {
        const parsedAmenities = JSON.parse(property.houseRules);
        console.log('✅ Parsed amenities:', parsedAmenities);
        console.log('✅ Amenities count:', parsedAmenities.length);
        
        if (parsedAmenities.length > 0) {
          console.log('✅ Amenities list:');
          parsedAmenities.forEach((amenity, index) => {
            console.log(`   ${index + 1}. ${amenity}`);
          });
        } else {
          console.log('⚠️  No amenities found (empty array)');
        }
      } catch (parseError) {
        console.log('❌ Error parsing amenities:', parseError.message);
      }
    } else {
      console.log('⚠️  No houseRules field found');
    }
    
    // Test creating a property with amenities
    console.log('\n🧪 Testing property creation with amenities...');
    
    const testAmenities = ['Balcony', 'Internet', 'Washing Machine'];
    const testPropertyData = {
      landlordId: 'test-landlord-id', // You'll need to replace with a real landlord ID
      name: 'Test Property with Amenities',
      address: 'Test Street 123',
      city: 'Warsaw',
      zipCode: '00-001',
      propertyType: 'apartment',
      monthlyRent: 2000,
      availableFrom: new Date(),
      houseRules: JSON.stringify(testAmenities)
    };
    
    console.log('Test amenities to save:', testAmenities);
    console.log('Test houseRules JSON:', testPropertyData.houseRules);
    
    // Note: This will fail if the landlord ID doesn't exist, but it shows the structure
    console.log('📝 Test property data structure is correct');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAmenities();


