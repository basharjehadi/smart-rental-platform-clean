# 🧪 Messaging System Security Testing Guide

This guide provides manual testing commands to verify the messaging system security features and payment gating.

## 🚀 Setup

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Ensure test users exist:**
   ```bash
   cd backend
   npm run db:seed
   ```

## 🔑 Test User Credentials

- **Tenant:** `tenant@test.com` / `password123`
- **Landlord:** `landlord@test.com` / `password123`
- **Admin:** `admin@test.com` / `password123`

## 🧪 Manual Testing Commands

### **1. Test Chat Blocking Before Payment**

#### **A. Create a test conversation and offer:**
```bash
# Login as tenant and create rental request
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@test.com","password":"password123"}' \
  http://localhost:3001/api/auth/login

# Use the returned token for subsequent requests
export TENANT_TOKEN="<TOKEN_FROM_LOGIN>"

# Create rental request (if needed)
curl -X POST \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"<PROPERTY_ID>","monthlyRent":2500,"securityDeposit":2500}' \
  http://localhost:3001/api/tenant/rental-requests
```

#### **B. Test message blocking (should return 403):**
```bash
# Before payment: should BLOCK with PAYMENT_REQUIRED (403)
curl -X POST \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"hi"}' \
  http://localhost:3001/api/messaging/conversations/<CONVERSATION_ID>/messages

# Expected response:
# {
#   "error": "Payment required to access chat",
#   "errorCode": "PAYMENT_REQUIRED"
# }
```

### **2. Test Chat Unlocking After Payment**

#### **A. Simulate payment webhook:**
```bash
# Update offer status to PAID (simulate payment)
curl -X PATCH \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"PAID"}' \
  http://localhost:3001/api/admin/offers/<OFFER_ID>

# Update conversation status to ACTIVE
curl -X PATCH \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACTIVE"}' \
  http://localhost:3001/api/admin/conversations/<CONVERSATION_ID>
```

#### **B. Test message sending (should return 201):**
```bash
# After webhook: should PASS (201)
curl -X POST \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"hi"}' \
  http://localhost:3001/api/messaging/conversations/<CONVERSATION_ID>/messages

# Expected response: 201 with message object
```

### **3. Test Socket.IO Security**

#### **A. Test conversation join blocking:**
```javascript
// In browser console or test client
const socket = io('http://localhost:3001', {
  auth: { token: '<INVALID_OR_EXPIRED_TOKEN>' }
});

socket.on('connect_error', (error) => {
  console.log('Expected: Connection blocked due to invalid token');
});

// Test with valid token but non-participant
socket.emit('join-conversation', '<CONVERSATION_ID>');
socket.on('chat-error', (error) => {
  console.log('Expected: NOT_MEMBER error');
});
```

#### **B. Test message sending via socket:**
```javascript
// Test message sending before payment
socket.emit('send-message', {
  conversationId: '<CONVERSATION_ID>',
  content: 'Test message'
});

socket.on('chat-error', (error) => {
  console.log('Expected: PAYMENT_REQUIRED error');
  console.log('Error:', error);
});
```

### **4. Test Rate Limiting**

#### **A. Rapid message sending:**
```bash
# Send 15 messages rapidly (should trigger rate limiting)
for i in {1..15}; do
  curl -X POST \
    -H "Authorization: Bearer $TENANT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"content\":\"Rate limit test $i\"}" \
    http://localhost:3001/api/messaging/conversations/<CONVERSATION_ID>/messages &
done

# Some should succeed, some should be rate limited
```

### **5. Test Error Codes**

#### **A. Test NOT_FOUND:**
```bash
# Test with non-existent conversation
curl -X POST \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"hi"}' \
  http://localhost:3001/api/messaging/conversations/nonexistent-id/messages

# Expected: 404 with errorCode: "NOT_FOUND"
```

#### **B. Test NOT_MEMBER:**
```bash
# Test with different user token
export LANDLORD_TOKEN="<LANDLORD_TOKEN>"
curl -X POST \
  -H "Authorization: Bearer $LANDLORD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"hi"}' \
  http://localhost:3001/api/messaging/conversations/<CONVERSATION_ID>/messages

# Expected: 403 with errorCode: "NOT_MEMBER"
```

## 🔍 Frontend Testing

### **1. Test Payment Required Banner**

1. **Login as tenant**
2. **Navigate to messaging**
3. **Select a conversation with unpaid offer**
4. **Verify banner shows: "Chat unlocks after payment"**
5. **Verify input box is disabled**

### **2. Test Chat Unlocking**

1. **Complete payment process**
2. **Verify banner disappears**
3. **Verify input box is enabled**
4. **Send test message**

### **3. Test Error Handling**

1. **Trigger various error conditions**
2. **Verify error messages display correctly**
3. **Verify error codes are shown**
4. **Test error clearing functionality**

## 📊 Expected Test Results

| Test Scenario | Expected Status | Expected Error Code |
|---------------|----------------|---------------------|
| Before Payment | 403 | `PAYMENT_REQUIRED` |
| After Payment | 201 | None |
| Non-Participant | 403 | `NOT_MEMBER` |
| Invalid Conversation | 404 | `NOT_FOUND` |
| Rate Limited | 429 | `RATE_LIMITED` |

## 🚨 Troubleshooting

### **Common Issues:**

1. **Token Expired:**
   - Re-login to get fresh token
   - Check JWT_SECRET in environment

2. **Database Connection:**
   - Ensure Prisma is connected
   - Check database migrations

3. **Socket Connection:**
   - Verify CORS settings
   - Check socket server initialization

### **Debug Commands:**

```bash
# Check conversation status
curl -H "Authorization: Bearer $TENANT_TOKEN" \
  http://localhost:3001/api/messaging/conversations/<CONVERSATION_ID>

# Check offer status
curl -H "Authorization: Bearer $TENANT_TOKEN" \
  http://localhost:3001/api/tenant/offer/<OFFER_ID>

# Check server logs
tail -f backend/logs/app.log
```

## ✅ Success Criteria

- [ ] Messages blocked before payment
- [ ] Messages allowed after payment
- [ ] Non-participants blocked
- [ ] Rate limiting working
- [ ] Error codes correct
- [ ] Frontend banners display
- [ ] Socket security enforced
- [ ] Webhook idempotent

## 📝 Notes

- **Payment simulation:** Use admin endpoints to simulate payment completion
- **Real-time testing:** Use browser console for socket testing
- **Database state:** Ensure clean test data between runs
- **Environment:** Test in development environment first
