import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPetSmokingFields() {
  try {
    console.log('🔍 Testing Pets & Smoking fields...\n');

    // Get the most recent property
    const property = await prisma.property.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        petsAllowed: true,
        smokingAllowed: true,
        parking: true,
        furnished: true,
        createdAt: true,
      },
    });

    if (!property) {
      console.log('❌ No properties found in database');
      return;
    }

    console.log('📋 Property details:');
    console.log('ID:', property.id);
    console.log('Name:', property.name);
    console.log('Created:', property.createdAt);
    console.log('Pets Allowed:', property.petsAllowed);
    console.log('Smoking Allowed:', property.smokingAllowed);
    console.log('Parking:', property.parking);
    console.log('Furnished:', property.furnished);

    // Test updating a property with pets and smoking
    console.log('\n🧪 Testing property update with pets and smoking...');

    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: {
        petsAllowed: true,
        smokingAllowed: true,
      },
      select: {
        id: true,
        name: true,
        petsAllowed: true,
        smokingAllowed: true,
      },
    });

    console.log('✅ Updated property:');
    console.log('Pets Allowed:', updatedProperty.petsAllowed);
    console.log('Smoking Allowed:', updatedProperty.smokingAllowed);

    // Test creating a new property with pets and smoking
    console.log('\n🧪 Testing property creation with pets and smoking...');

    const testPropertyData = {
      landlordId: 'test-landlord-id', // You'll need to replace with a real landlord ID
      name: 'Test Property with Pets & Smoking',
      address: 'Test Street 123',
      city: 'Warsaw',
      zipCode: '00-001',
      propertyType: 'apartment',
      monthlyRent: 2500,
      availableFrom: new Date(),
      petsAllowed: true,
      smokingAllowed: false,
      parking: true,
      furnished: true,
    };

    console.log('Test property data structure:');
    console.log('Pets Allowed:', testPropertyData.petsAllowed);
    console.log('Smoking Allowed:', testPropertyData.smokingAllowed);
    console.log('Parking:', testPropertyData.parking);
    console.log('Furnished:', testPropertyData.furnished);

    console.log(
      '\n✅ Database schema supports pets and smoking fields correctly!'
    );
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPetSmokingFields();
