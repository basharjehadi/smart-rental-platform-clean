# 🏊 Request Pool System - Smart Rental Platform

## **📋 Overview**

The Request Pool System is the core matching engine that connects tenant rental requests with available landlord properties. This system implements a **reverse marketplace** where tenants submit requests and landlords respond with offers.

## **🔄 Core Business Flow**

### **1. Tenant Journey (Reverse Marketplace)**
```
Submit Rental Request → Request Goes to Pool → Landlords See Request → 
Landlords Make Offers → Tenant Receives Multiple Offers → 
Tenant Accepts Best Offer → Makes Payment → Chat Unlocks
```

**Key Points:**
- ❌ **NO property browsing** - tenants only see properties when landlords make offers
- ✅ **Request-based matching** - system finds landlords with matching properties
- ✅ **Multiple offers** - one request can get offers from multiple landlords
- ✅ **Payment unlocks communication** - chat only available after payment

### **2. Request Lifecycle**
```
ACTIVE → EXPIRED (3 days before move-in) OR MATCHED (tenant accepts+pay)
```

## **🚀 Smart Expiration System**

### **Dynamic Expiration Logic**
- **Expiration = Move-in Date - 3 days**
- **NOT generic 30 days** - tied to actual business need
- **3-day buffer** gives tenants time to find alternatives or extend move-in date

### **Expiration Scenarios**
1. **Natural Expiration**: 3 days before move-in date
2. **Successful Match**: Tenant accepts offer and makes payment
3. **Manual Cancellation**: Tenant cancels request

### **Example Timeline**
```
Request Created: March 1st
Move-in Date: March 25th
Expiration: March 22nd (25th - 3 days)
Active Period: March 1st - March 22nd (21 days)
```

## **🏗️ Multi-Landlord + Multi-Property Matching**

### **One Request → Multiple Landlords**
- **Single request** can match with **multiple landlords**
- **Each landlord** can have **multiple matching properties**
- **All matches** are created simultaneously when request enters pool

### **Matching Algorithm**
```javascript
// Find ALL matching landlords based on:
1. Landlord availability: true
2. Property status: 'AVAILABLE'
3. Property availability: true
4. Location match
5. Budget match
6. Property type match
7. Bedroom count match
```

### **Match Creation**
```javascript
// For each matching landlord, create LandlordRequestMatch:
{
  landlordId: landlord.id,
  rentalRequestId: request.id,
  isViewed: false,
  isResponded: false,
  matchReason: "Location: Downtown, Budget: $1500, Type: Apartment"
}
```

## **📊 Request Pool States**

### **Pool Status Values**
- `ACTIVE` - Request is actively seeking matches
- `EXPIRED` - Request expired (3 days before move-in)
- `MATCHED` - Tenant accepted offer and paid
- `CANCELLED` - Tenant manually cancelled

### **Landlord Match States**
- `isViewed: false` - Landlord hasn't seen the request yet
- `isViewed: true` - Landlord has viewed the request
- `isResponded: true` - Landlord has made an offer or declined

## **🔄 Decline vs Expire Logic**

### **Landlord Decline**
- ✅ **Request stays ACTIVE** in pool
- ✅ **Continues searching** for other landlords
- ✅ **Only this landlord** is marked as declined
- ❌ **Request does NOT expire** due to decline

### **Request Expiration**
- ✅ **Only expires** when 3 days before move-in date
- ✅ **Only expires** when tenant accepts+pay for an offer
- ❌ **Does NOT expire** due to landlord declines

## **💰 Offer Management**

### **Multiple Offers Per Request**
- **One request** can receive **multiple offers**
- **Each offer** is independent
- **Tenant can accept** any offer they prefer

### **Offer Expiration on Payment**
```javascript
// When tenant accepts+pay for one offer:
1. Mark selected offer as 'PAID'
2. Expire ALL other offers as 'REJECTED'
3. Remove request from pool (status: 'MATCHED')
4. Unlock chat communication
```

## **🔔 Notification System**

### **Expiration Warnings**
- **Tenants**: Warned 2 days before expiration
- **Landlords**: Notified about requests approaching expiration
- **Prevents spam**: Only one notification per 24 hours

### **Notification Types**
- `REQUEST_EXPIRING_SOON` - 2 days before expiration
- `REQUEST_EXPIRED` - When request expires
- `NEW_MATCH` - When landlord gets new request match

## **🧹 Automated Cleanup**

### **Daily Cleanup Process**
1. **Find expired requests** (expiresAt < now)
2. **Update status** to 'EXPIRED'
3. **Send notifications** to tenants
4. **Warn approaching expiration** (2 days before)
5. **Notify landlords** about expiring requests

### **Cleanup Triggers**
- **Cron job**: Daily at 2:00 AM
- **Manual trigger**: Admin dashboard
- **Real-time**: When tenant accepts+pay

## **📈 Performance & Scalability**

### **Database Indexes**
```sql
-- Optimized for request pool queries
CREATE INDEX idx_rental_requests_pool_status_expires 
ON rental_requests(pool_status, expires_at);

CREATE INDEX idx_landlord_matches_status 
ON landlord_request_matches(landlord_id, is_responded, is_viewed);
```

### **Caching Strategy**
- **Request cache**: Frequently accessed requests
- **Match cache**: Active landlord-request matches
- **Analytics cache**: Pool statistics

### **Batch Operations**
- **Match creation**: Batch insert for multiple landlords
- **Status updates**: Batch update expired requests
- **Notifications**: Batch send expiration warnings

## **🔧 API Endpoints**

### **Request Management**
- `POST /api/rental-requests` - Create new request
- `GET /api/rental-requests` - Get user's requests
- `PUT /api/rental-requests/:id` - Update request
- `DELETE /api/rental-requests/:id` - Cancel request

### **Landlord Actions**
- `GET /api/landlord/matches` - Get request matches
- `POST /api/landlord/offers` - Make offer on request
- `PUT /api/landlord/requests/:id/decline` - Decline request

### **Tenant Actions**
- `PUT /api/offers/:id/status` - Accept/decline/pay offer
- `GET /api/offers` - Get offers on user's requests

## **📊 Monitoring & Analytics**

### **Key Metrics**
- **Active requests** in pool
- **Match success rate** (requests with offers)
- **Average time** to first offer
- **Expiration rate** (requests that expire without match)

### **Dashboard Views**
- **Admin**: Overall pool statistics
- **Landlord**: Personal match performance
- **Tenant**: Request status and offer count

## **🚨 Error Handling**

### **Common Scenarios**
- **No matching landlords** - Request stays active until expiration
- **Landlord decline** - Request continues searching
- **Payment failure** - Offer stays pending, request stays active
- **System errors** - Graceful degradation, retry mechanisms

### **Fallback Strategies**
- **Cache failures** - Fallback to database queries
- **Notification failures** - Log errors, continue processing
- **Cleanup failures** - Retry on next cron run

## **🔮 Future Enhancements**

### **Planned Features**
- **Smart matching** - AI-powered landlord-request matching
- **Priority queuing** - VIP tenant requests
- **Market insights** - Demand-supply analytics
- **Automated offers** - AI-generated initial offers

### **Scalability Improvements**
- **Microservices** - Split request pool into separate service
- **Event streaming** - Real-time match notifications
- **Global distribution** - Multi-region request pools

## **📚 Related Documentation**

- [Property Availability System](./PROPERTY_AVAILABILITY_SYSTEM.md)
- [Chat System](./README_CHAT_SYSTEM.md)
- [Payment System](./docs/PAYMENT_SYSTEM.md)
- [Notification System](./docs/NOTIFICATION_SYSTEM.md)

---

**Last Updated**: March 2024  
**Version**: 2.0 (Move-in Date Based Expiration)  
**Maintainer**: Development Team
