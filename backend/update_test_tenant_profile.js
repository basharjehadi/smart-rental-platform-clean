import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTestTenantProfile() {
  try {
    console.log('🔧 Updating test tenant profile...\n');
    
    // Find the test tenant
    const testTenant = await prisma.user.findUnique({
      where: { email: 'tenant@test.com' }
    });
    
    if (!testTenant) {
      console.log('❌ Test tenant not found. Please run create_test_users.js first.');
      return;
    }
    
    // Update tenant with profile data
    const updatedTenant = await prisma.user.update({
      where: { email: 'tenant@test.com' },
      data: {
        firstName: 'Jan',
        lastName: 'Kowalski',
        phoneNumber: '+48123456789',
        dateOfBirth: new Date('1995-06-15'), // 30 years old
        pesel: '95061512345', // PESEL for June 15, 1995
        profession: 'Software Engineer',
        citizenship: 'Polish',
        country: 'Poland',
        city: 'Poznań',
        street: 'Jarochowskiego 97/19',
        zipCode: '60-129',
        profileImage: '/uploads/profile-photos/default-tenant.jpg'
      }
    });
    
    console.log('✅ Updated test tenant profile:');
    console.log(`   Name: ${updatedTenant.firstName} ${updatedTenant.lastName}`);
    console.log(`   Age: ${calculateAge(updatedTenant.dateOfBirth)}`);
    console.log(`   Profession: ${updatedTenant.profession}`);
    console.log(`   Phone: ${updatedTenant.phoneNumber}`);
    console.log(`   Location: ${updatedTenant.street}, ${updatedTenant.city}`);
    
  } catch (error) {
    console.error('❌ Error updating test tenant profile:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'Unknown';
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return `${age} years`;
}

updateTestTenantProfile();
