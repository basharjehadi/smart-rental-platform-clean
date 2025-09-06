# Lease Renewal System - End-to-End Testing Guide

*Updated: January 2025 - Complete Testing Documentation*

## Overview

This guide provides comprehensive end-to-end testing for the Enhanced Lease Renewal & Termination System. The tests cover the complete workflow from authentication to renewal completion, including security, permissions, state machine, and real-time notifications.

## 🧪 Test Scripts Available

### 1. Node.js Test (Comprehensive)
**File:** `backend/test-lease-lifecycle-renewal.js`
**Requirements:** Node.js with `node-fetch` and `@prisma/client`
**Run:** `node test-lease-lifecycle-renewal.js`

### 2. Simple Node.js Test
**File:** `backend/test-renewal-simple.js`
**Requirements:** Node.js (uses built-in fetch)
**Run:** `node test-renewal-simple.js`

### 3. PowerShell Test (Windows)
**File:** `backend/test-renewal-windows.ps1`
**Requirements:** Windows PowerShell
**Run:** `.\test-renewal-windows.ps1`

## 🚀 Prerequisites

### Backend Server
- Backend server must be running on `http://localhost:3001`
- Database must be accessible and migrated
- Test users must exist in the database

### Test Users
The following test users must exist in your database:
- **Tenant:** `tenant@test.com` / `password123`
- **Landlord:** `landlord@test.com` / `password123`
- **Admin:** `admin@test.com` / `password123`

### Test Data
- At least one active lease in the database
- Property associated with the lease
- Valid tenant and landlord relationships

## 📋 Test Coverage

### 1. Authentication Tests
- ✅ Tenant login
- ✅ Landlord login
- ✅ Admin login
- ✅ Token validation

### 2. Renewal Workflow Tests
- ✅ Tenant sends renewal request (note only)
- ✅ Tenant cannot set terms/rent (security)
- ✅ Landlord proposes renewal terms
- ✅ Workflow state validation
- ✅ Renewal list retrieval
- ✅ Tenant accepts renewal

### 3. State Machine Tests
- ✅ Initial state (no active renewal)
- ✅ PENDING state (tenant request)
- ✅ COUNTERED state (landlord proposal)
- ✅ ACCEPTED state (tenant acceptance)
- ✅ State transitions validation

### 4. Security & Permissions Tests
- ✅ Unauthorized access prevention
- ✅ Cross-tenant access prevention
- ✅ Role-based action restrictions
- ✅ Invalid ID handling

### 5. Auto-Expiration Tests
- ✅ Expired renewal detection
- ✅ Auto-expiration endpoint
- ✅ Expired count validation

### 6. Notification System Tests
- ✅ Renewal request notifications
- ✅ Proposal notifications
- ✅ Acceptance notifications
- ✅ Real-time delivery

## 🔧 Running the Tests

### Option 1: Node.js Comprehensive Test
```bash
cd backend
npm install node-fetch @prisma/client
node test-lease-lifecycle-renewal.js
```

### Option 2: Simple Node.js Test
```bash
cd backend
node test-renewal-simple.js
```

### Option 3: PowerShell Test (Windows)
```powershell
cd backend
.\test-renewal-windows.ps1
```

## 📊 Expected Test Results

### Successful Test Run
```
🚀 Starting Lease Renewal System Tests...

🔐 Testing Authentication...
✅ PASS: Tenant login should succeed
✅ PASS: Landlord login should succeed
✅ PASS: Admin login should succeed

🔄 Testing Renewal Endpoints...
✅ PASS: Tenant renewal request should succeed
✅ PASS: Tenant should not be able to set terms/rent
✅ PASS: Should return appropriate error message
✅ PASS: Landlord proposal should succeed
✅ PASS: Workflow state should be retrievable
✅ PASS: Should have active renewal
✅ PASS: Tenant should be able to accept renewal
✅ PASS: Should be able to get renewals list
✅ PASS: Should have at least one renewal
✅ PASS: Tenant should be able to accept renewal

🛡️ Testing Security and Permissions...
✅ PASS: Unauthorized access should fail
✅ PASS: Landlord should not be able to accept their own proposal
✅ PASS: Invalid renewal ID should fail

⏰ Testing Auto-Expiration...
✅ PASS: Auto-expiration endpoint should be accessible
✅ PASS: Should return expired count

🔔 Testing Notification System...
✅ PASS: Renewal request should succeed for notification test
✅ PASS: Should have renewal notifications

============================================================
📊 TEST RESULTS SUMMARY
============================================================
✅ Passed: 20
❌ Failed: 0
📈 Success Rate: 100.0%
============================================================

🎉 ALL TESTS PASSED! The lease renewal system is working perfectly!
============================================================
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Failures
**Error:** "Tenant login should succeed" fails
**Solution:** 
- Ensure test users exist in database
- Check user credentials
- Verify JWT token generation

#### 2. No Leases Found
**Error:** "No existing leases found. Skipping renewal tests."
**Solution:**
- Create a test lease in the database
- Ensure lease has valid tenant/landlord relationships
- Check lease status is ACTIVE

#### 3. Permission Errors
**Error:** "Tenant should not be able to set terms/rent" fails
**Solution:**
- Verify backend security guards are working
- Check role validation logic
- Ensure API endpoints enforce permissions

#### 4. Notification Issues
**Error:** "Should have renewal notifications" fails
**Solution:**
- Check notification service is working
- Verify Socket.io is running
- Ensure notification creation logic is correct

### Debug Mode

To enable detailed debugging, modify the test scripts to include more verbose logging:

```javascript
// Add this to the makeRequest function
const makeRequest = async (url, options = {}) => {
  console.log(`Making request to: ${url}`);
  console.log(`Options:`, JSON.stringify(options, null, 2));
  // ... rest of function
};
```

## 📈 Performance Testing

### Load Testing
For performance testing, you can modify the test scripts to:
- Create multiple concurrent renewal requests
- Test with large numbers of renewals
- Measure response times
- Test database performance under load

### Example Load Test
```javascript
// Test concurrent renewal requests
const concurrentTests = Array(10).fill().map(async (_, index) => {
  return await makeRequest(`/leases/${leaseId}/renewals`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}` },
    body: JSON.stringify({ note: `Concurrent test ${index}` })
  });
});

const results = await Promise.all(concurrentTests);
```

## 🔍 Manual Testing Checklist

### UI Testing
- [ ] Tenant renewal modal shows only note field
- [ ] Landlord proposal modal shows all fields
- [ ] Quick presets work correctly
- [ ] Live preview updates correctly
- [ ] Buttons show/hide based on workflow state
- [ ] Real-time notifications appear instantly

### API Testing
- [ ] All endpoints return correct status codes
- [ ] Request/response formats are correct
- [ ] Error messages are helpful
- [ ] Security restrictions are enforced
- [ ] Database updates are correct

### Integration Testing
- [ ] Renewal workflow completes successfully
- [ ] New lease is created on acceptance
- [ ] Payment schedule updates correctly
- [ ] Notifications are sent to correct parties
- [ ] Auto-expiration works as expected

## 📝 Test Data Management

### Creating Test Data
```sql
-- Create test users
INSERT INTO users (id, name, email, password, role) VALUES
('tenant-test-id', 'Test Tenant', 'tenant@test.com', 'hashed_password', 'TENANT'),
('landlord-test-id', 'Test Landlord', 'landlord@test.com', 'hashed_password', 'LANDLORD'),
('admin-test-id', 'Test Admin', 'admin@test.com', 'hashed_password', 'ADMIN');

-- Create test property
INSERT INTO properties (id, title, address, monthly_rent, status) VALUES
('property-test-id', 'Test Property', '123 Test St', 1000, 'AVAILABLE');

-- Create test lease
INSERT INTO leases (id, start_date, end_date, rent_amount, status, property_id) VALUES
('lease-test-id', NOW(), NOW() + INTERVAL '1 year', 1000, 'ACTIVE', 'property-test-id');
```

### Cleaning Up Test Data
```sql
-- Clean up test data
DELETE FROM renewal_requests WHERE lease_id = 'lease-test-id';
DELETE FROM leases WHERE id = 'lease-test-id';
DELETE FROM properties WHERE id = 'property-test-id';
DELETE FROM users WHERE email IN ('tenant@test.com', 'landlord@test.com', 'admin@test.com');
```

## 🎯 Success Criteria

### Functional Requirements
- ✅ All renewal workflow states work correctly
- ✅ Security permissions are enforced
- ✅ Real-time notifications are delivered
- ✅ Auto-expiration works as expected
- ✅ Database integrity is maintained

### Performance Requirements
- ✅ API responses under 500ms
- ✅ Database queries are optimized
- ✅ Real-time notifications are instant
- ✅ System handles concurrent requests

### User Experience Requirements
- ✅ UI is intuitive and responsive
- ✅ Error messages are helpful
- ✅ Workflow is clear and logical
- ✅ Notifications provide good feedback

## 🚀 Continuous Integration

### GitHub Actions Example
```yaml
name: Lease Renewal Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:renewal
```

### Docker Test Environment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "test:renewal"]
```

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Enhanced Renewal System](./ENHANCED_RENEWAL_SYSTEM.md)
- [Lease Lifecycle Documentation](./LEASE_LIFECYCLE.md)
- [Notification System](./NOTIFICATION_SYSTEM_UPDATE.md)

## 🎉 Conclusion

The comprehensive test suite ensures that the Enhanced Lease Renewal & Termination System works correctly across all scenarios. Regular testing helps maintain system reliability and provides confidence in the platform's professional-grade lease management capabilities.

**Remember:** Always run tests before deploying to production and after making any changes to the renewal system!


