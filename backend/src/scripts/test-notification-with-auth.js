import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

async function testNotificationWithAuth() {
  try {
    console.log('🔐 Testing Notification System with Authentication...\n');

    // Step 1: Find or create a landlord user
    console.log('1️⃣ Setting up test landlord user...');
    let landlord = await prisma.user.findFirst({
      where: {
        role: 'LANDLORD',
        email: 'landlord@test.com',
      },
    });

    if (!landlord) {
      console.log('   Creating new landlord user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      landlord = await prisma.user.create({
        data: {
          name: 'Test Landlord',
          email: 'landlord@test.com',
          password: hashedPassword,
          role: 'LANDLORD',
        },
      });
      console.log('   ✅ Created landlord user:', landlord.id);
    } else {
      console.log('   ✅ Found existing landlord user:', landlord.id);
    }

    // Step 2: Generate a valid JWT token
    console.log('\n2️⃣ Generating JWT token...');
    const token = jwt.sign(
      {
        userId: landlord.id,
        email: landlord.email,
        role: landlord.role,
      },
      process.env.JWT_SECRET || 'your_jwt_secret_here_change_in_production',
      { expiresIn: '1h' }
    );
    console.log('   ✅ JWT token generated');

    // Step 3: Test notification endpoints with valid token
    console.log('\n3️⃣ Testing notification endpoints with valid token...');

    // Test unread counts
    try {
      const countsResponse = await axios.get(
        `${API_BASE}/notifications/unread-counts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('   ✅ Unread counts endpoint works:', countsResponse.status);
      console.log('   📊 Response data:', countsResponse.data);
    } catch (error) {
      console.log(
        '   ❌ Unread counts endpoint failed:',
        error.response?.status,
        error.response?.data
      );
    }

    // Test all notifications
    try {
      const notificationsResponse = await axios.get(
        `${API_BASE}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        '   ✅ Notifications endpoint works:',
        notificationsResponse.status
      );
      console.log('   📊 Response data:', notificationsResponse.data);
    } catch (error) {
      console.log(
        '   ❌ Notifications endpoint failed:',
        error.response?.status,
        error.response?.data
      );
    }

    // Step 4: Check if there are any notifications for this landlord
    console.log('\n4️⃣ Checking database for notifications...');
    const notifications = await prisma.notification.findMany({
      where: { userId: landlord.id },
    });

    console.log(
      `   📧 Found ${notifications.length} notifications in database:`
    );
    notifications.forEach((notif, index) => {
      console.log(
        `      ${index + 1}. ${notif.title} (${notif.type}) - Read: ${notif.isRead}`
      );
    });

    // Step 5: Check unread count in database
    const unreadCount = await prisma.notification.count({
      where: {
        userId: landlord.id,
        isRead: false,
      },
    });

    console.log(`\n📊 Database unread count: ${unreadCount}`);

    // Step 6: Summary
    console.log('\n🎯 Test Summary:');
    if (unreadCount > 0) {
      console.log('   ✅ Unread notifications exist in database');
      console.log('   ✅ API should return these notifications');
      console.log('   ✅ Frontend should display notification badge');
    } else {
      console.log('   ❌ No unread notifications found');
      console.log("   ❌ Frontend won't show any notifications");
      console.log(
        '   💡 Try creating a new rental request to trigger notifications'
      );
    }

    console.log('\n🔑 Test Credentials:');
    console.log('   Email: landlord@test.com');
    console.log('   Password: password123');
    console.log('   Role: LANDLORD');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationWithAuth();
