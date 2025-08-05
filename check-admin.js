import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function checkAndCreateAdmin() {
  console.log('🔍 Checking Admin Account');
  console.log('========================');
  
  try {
    // Try to login as admin first
    console.log('1️⃣ Trying to login as admin...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@test.com',
        password: 'password123'
      });
      console.log('✅ Admin account exists and login works!');
      console.log('   Email: admin@test.com');
      console.log('   Password: password123');
      console.log('   Token:', loginResponse.data.token ? '✅ Present' : '❌ Missing');
      return;
    } catch (loginError) {
      console.log('❌ Admin login failed, creating new admin account...');
    }
    
    // Create Admin Account
    console.log('\n2️⃣ Creating Admin Account...');
    const adminData = {
      email: 'admin@test.com',
      password: 'password123',
      name: 'Test Admin',
      role: 'ADMIN'
    };
    
    const adminResponse = await axios.post(`${API_BASE}/auth/register`, adminData);
    console.log('✅ Admin created successfully!');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Token:', adminResponse.data.token ? '✅ Present' : '❌ Missing');
    
    // Test login with new admin account
    console.log('\n3️⃣ Testing admin login...');
    const testLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });
    console.log('✅ Admin login test successful!');
    
    console.log('\n🎉 Admin account ready for use!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('==========================');
    console.log('Email: admin@test.com');
    console.log('Password: password123');
    console.log('\n🌐 Frontend URL: http://localhost:4173/');
    
  } catch (error) {
    console.error('❌ Error with admin account:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

checkAndCreateAdmin()
  .then(() => {
    console.log('\n✅ Admin account check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 