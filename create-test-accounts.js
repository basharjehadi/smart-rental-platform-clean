import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function createTestAccounts() {
  console.log('🔐 Creating Test Accounts');
  console.log('========================');
  
  const accounts = [];
  
  try {
    // Create Tenant Account
    console.log('\n1️⃣ Creating Tenant Account...');
    const tenantData = {
      email: 'tenant@test.com',
      password: 'password123',
      name: 'Test Tenant',
      role: 'TENANT'
    };
    
    const tenantResponse = await axios.post(`${API_BASE}/auth/register`, tenantData);
    console.log('✅ Tenant created successfully');
    console.log('   Email: tenant@test.com');
    console.log('   Password: password123');
    console.log('   Token:', tenantResponse.data.token ? '✅ Present' : '❌ Missing');
    
    accounts.push({
      role: 'TENANT',
      email: 'tenant@test.com',
      password: 'password123',
      token: tenantResponse.data.token
    });
    
    // Create Landlord Account
    console.log('\n2️⃣ Creating Landlord Account...');
    const landlordData = {
      email: 'landlord@test.com',
      password: 'password123',
      name: 'Test Landlord',
      role: 'LANDLORD'
    };
    
    const landlordResponse = await axios.post(`${API_BASE}/auth/register`, landlordData);
    console.log('✅ Landlord created successfully');
    console.log('   Email: landlord@test.com');
    console.log('   Password: password123');
    console.log('   Token:', landlordResponse.data.token ? '✅ Present' : '❌ Missing');
    
    accounts.push({
      role: 'LANDLORD',
      email: 'landlord@test.com',
      password: 'password123',
      token: landlordResponse.data.token
    });
    
    // Create Admin Account
    console.log('\n3️⃣ Creating Admin Account...');
    const adminData = {
      email: 'admin@test.com',
      password: 'password123',
      name: 'Test Admin',
      role: 'ADMIN'
    };
    
    const adminResponse = await axios.post(`${API_BASE}/auth/register`, adminData);
    console.log('✅ Admin created successfully');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Token:', adminResponse.data.token ? '✅ Present' : '❌ Missing');
    
    accounts.push({
      role: 'ADMIN',
      email: 'admin@test.com',
      password: 'password123',
      token: adminResponse.data.token
    });
    
    console.log('\n🎉 All test accounts created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('====================');
    
    accounts.forEach(account => {
      console.log(`\n${account.role}:`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
    });
    
    console.log('\n🌐 Frontend URL: http://localhost:4173/');
    console.log('🔧 Backend URL: http://localhost:3001/');
    
    return accounts;
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️ Some accounts already exist. Here are the login credentials:');
      console.log('\n📋 Login Credentials:');
      console.log('====================');
      console.log('\nTENANT:');
      console.log('   Email: tenant@test.com');
      console.log('   Password: password123');
      console.log('\nLANDLORD:');
      console.log('   Email: landlord@test.com');
      console.log('   Password: password123');
      console.log('\nADMIN:');
      console.log('   Email: admin@test.com');
      console.log('   Password: password123');
      console.log('\n🌐 Frontend URL: http://localhost:4173/');
      console.log('🔧 Backend URL: http://localhost:3001/');
    } else {
      console.error('❌ Error creating accounts:', error.response?.data || error.message);
    }
    return [];
  }
}

createTestAccounts()
  .then(() => {
    console.log('\n✅ Test accounts ready for use!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 