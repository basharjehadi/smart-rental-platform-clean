# Smart Rental System API Documentation

*Updated: January 2025 - Based on Actual Implementation*

## Overview

The Smart Rental System API provides a comprehensive set of endpoints for managing rental properties, users, payments, contracts, and move-in verification. This document outlines all **actually implemented** endpoints, their parameters, and expected responses.

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**JWT Token Details:**
- **Expiration**: 7 days
- **Payload**: `{ userId, email, role }`
- **Storage**: localStorage (frontend)

## Response Format

API responses vary by endpoint. Some follow a consistent format, others return data directly:

### Success Response (varies by endpoint)
```json
{
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

## Endpoints

### Authentication (`/api/auth`)

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe", // or firstName + lastName
  "email": "john@example.com",
  "password": "password123",
  "role": "TENANT" // TENANT, LANDLORD, ADMIN
}
```

**Response:**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "TENANT",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful.",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "TENANT"
  },
  "token": "jwt_token_here"
}
```

#### GET /api/auth/me
Get current user information (requires authentication).

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "TENANT",
    "isVerified": false,
    "kycStatus": "PENDING"
  }
}
```

### Social Authentication (`/api/auth`)

#### GET /api/auth/google
Initiate Google OAuth login.

#### GET /api/auth/google/callback
Google OAuth callback (handled automatically).

### Properties (`/api/properties`)

#### GET /api/properties
Get landlord's properties (requires LANDLORD role).

**Response:**
```json
{
  "properties": [
    {
      "id": "property_id",
      "name": "Downtown Apartment",
      "address": "123 Main St",
      "city": "Warsaw",
      "status": "AVAILABLE",
      "images": ["image1.jpg"]
    }
  ]
}
```

#### POST /api/properties
Create a new property (requires LANDLORD role).

**Request Body:**
```json
{
  "name": "Downtown Apartment",
  "address": "123 Main St",
  "city": "Warsaw",
  "zipCode": "00-001",
  "propertyType": "Apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "size": "80m²",
  "furnished": true,
  "parking": false,
  "petsAllowed": true,
  "description": "Beautiful apartment in downtown",
  "images": ["image1.jpg", "image2.jpg"],
  "rulesText": "No smoking, no pets"
}
```

#### PUT /api/properties/:id
Update property (requires LANDLORD role and ownership).

#### DELETE /api/properties/:id
Delete property (requires LANDLORD role and ownership).

### Rental Requests (`/api/`)

#### POST /api/rental-request
Create a rental request (requires TENANT role).

**Request Body:**
```json
{
  "title": "Looking for 2BR apartment",
  "description": "Need a 2-bedroom apartment in downtown",
  "location": "Warsaw, Poland",
  "moveInDate": "2025-02-01T00:00:00.000Z",
  "budget": 3000,
  "budgetFrom": 2500,
  "budgetTo": 3500,
  "propertyType": "Apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "furnished": true,
  "parking": false,
  "petsAllowed": true,
  "additionalRequirements": "Near metro station"
}
```

#### GET /api/rental-requests
Get all rental requests (requires LANDLORD role).

#### GET /api/pool/rental-requests
Get active rental requests from pool (requires LANDLORD role).

#### PUT /api/rental-request/:id
Update rental request (requires TENANT role).

#### DELETE /api/rental-request/:id
Delete rental request (requires TENANT role).

### Offers (`/api/`)

#### POST /api/rental-request/:requestId/offer
Create an offer for a rental request (requires LANDLORD role).

**Request Body:**
```json
{
  "rentAmount": 2800,
  "depositAmount": 2800,
  "leaseDuration": 12,
  "description": "Great apartment in downtown",
  "utilitiesIncluded": false,
  "availableFrom": "2025-02-01T00:00:00.000Z",
  "propertyAddress": "123 Main St, Warsaw",
  "propertyType": "Apartment",
  "rulesText": "No smoking, no pets"
}
```

#### GET /api/tenant/offers
Get tenant's offers (requires TENANT role).

#### GET /api/tenant/offer/:offerId
Get offer details (requires TENANT role).

#### PATCH /api/tenant/offer/:offerId
Update offer status (requires TENANT role).

#### PUT /api/offers/:id/status
Update offer status (requires TENANT role).

### Payments (`/api/payments`)

#### POST /api/payments/create-intent
Create a payment intent.

**Request Body:**
```json
{
  "offerId": "offer_id",
  "amount": 5600,
  "purpose": "DEPOSIT_AND_FIRST_MONTH",
  "paymentGateway": "STRIPE" // STRIPE, PAYU, P24, TPAY, MOCK
}
```

**Response:**
```json
{
  "paymentIntent": {
    "id": "payment_intent_id",
    "clientSecret": "client_secret",
    "amount": 5600
  }
}
```

#### POST /api/payments/complete-mock
Complete mock payment (development).

**Request Body:**
```json
{
  "offerId": "offer_id",
  "amount": 5600,
  "purpose": "DEPOSIT_AND_FIRST_MONTH"
}
```

#### GET /api/payments/history
Get payment history (requires authentication).

### Move-In Verification (`/api/move-in`)

#### GET /api/move-in/offers/:id/status
Get move-in verification status.

**Response:**
```json
{
  "success": true,
  "data": {
    "offerId": "offer_id",
    "status": "PENDING", // PENDING, VERIFIED, DENIED
    "deadline": "2025-02-02T00:00:00.000Z",
    "verifiedAt": null,
    "cancellationReason": null,
    "evidence": []
  }
}
```

#### GET /api/move-in/offers/:id/move-in/ui-state
Get move-in UI state.

**Response:**
```json
{
  "success": true,
  "data": {
    "now": "2025-01-01T00:00:00.000Z",
    "paymentDate": "2024-12-15T00:00:00.000Z",
    "leaseStart": "2025-02-01T00:00:00.000Z",
    "verificationStatus": "PENDING",
    "window": {
      "phase": "WINDOW_OPEN", // PRE_MOVE_IN, WINDOW_OPEN, WINDOW_CLOSED
      "windowClose": "2025-02-03T00:00:00.000Z"
    },
    "canReportIssue": true,
    "canConfirmOrDeny": true
  }
}
```

#### POST /api/move-in/offers/:id/verify
Confirm move-in.

**Response:**
```json
{
  "message": "Move-in verified successfully."
}
```

#### POST /api/move-in/offers/:id/deny
Deny move-in.

**Request Body:**
```json
{
  "reason": "Property condition issues"
}
```

#### GET /api/move-in/offers/:id/issues
Get move-in issues for an offer.

### Lease Renewal & Termination (`/api/leases`)

#### POST /api/leases/:id/renewals
Create a renewal request for a lease.

**Request Body:**
```json
{
  "note": "I would like to renew my lease",
  "proposedTermMonths": 12,        // Landlord only
  "proposedMonthlyRent": 1200,     // Landlord only
  "proposedStartDate": "2025-01-01T00:00:00.000Z"  // Landlord only
}
```

**Response:**
```json
{
  "success": true,
  "renewal": {
    "id": "renewal_id",
    "leaseId": "lease_id",
    "status": "PENDING",
    "proposedTermMonths": 12,
    "proposedMonthlyRent": 1200,
    "note": "I would like to renew my lease",
    "expiresAt": "2025-01-08T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Security Notes:**
- Tenants can only send `note` field
- Landlords can set all fields including terms and rent
- Backend enforces role-based permissions

#### POST /api/renewals/:id/counter
Counter an existing renewal request (landlord only).

**Request Body:**
```json
{
  "proposedTermMonths": 6,
  "proposedMonthlyRent": 1100,
  "note": "How about 6 months with a small discount?"
}
```

#### POST /api/renewals/:id/accept
Accept a renewal request (tenant only).

**Response:**
```json
{
  "success": true
}
```

**Side Effects:**
- Creates new lease with proposed terms
- Updates payment schedule with new rent
- Sends notifications to both parties

#### POST /api/renewals/:id/decline
Decline a renewal request (either party).

**Response:**
```json
{
  "success": true,
  "renewal": { ... }
}
```

#### GET /api/leases/:id/renewals
Get all renewal requests for a lease.

**Response:**
```json
{
  "success": true,
  "renewals": [
    {
      "id": "renewal_id",
      "status": "PENDING",
      "proposedTermMonths": 12,
      "proposedMonthlyRent": 1200,
      "note": "Renewal request",
      "initiator": {
        "id": "user_id",
        "name": "John Doe",
        "role": "TENANT"
      },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/leases/:id/renewal-workflow
Get current renewal workflow state and permissions.

**Response:**
```json
{
  "success": true,
  "workflow": {
    "hasActiveRenewal": true,
    "currentStatus": "PENDING",
    "canRequestRenewal": false,
    "canProposeRenewal": false,
    "canCounterRenewal": true,
    "canAcceptRenewal": false,
    "canDeclineRenewal": true,
    "latestRenewal": { ... },
    "leaseEndDate": "2025-12-31T00:00:00.000Z",
    "daysUntilExpiry": 30
  }
}
```

#### POST /api/renewals/expire-old
Auto-expire old renewal requests (admin/cron endpoint).

**Response:**
```json
{
  "success": true,
  "expiredCount": 3,
  "message": "Expired 3 renewal requests"
}
```

### User Management (`/api/users`)

#### GET /api/users/profile
Get user profile (requires authentication).

#### PUT /api/users/profile
Update user profile (requires authentication).

#### POST /api/users/upload-identity
Upload identity document (requires authentication).

#### GET /api/users/trust-level/:userId
Get user trust level.

### Messaging (`/api/messaging`)

#### GET /api/messaging/conversations
Get user conversations (requires authentication).

#### GET /api/messaging/conversations/:id/messages
Get conversation messages (requires authentication).

#### POST /api/messaging/conversations/:id/messages
Send a message (requires authentication).

### Reviews (`/api/reviews`)

#### GET /api/reviews/user/:userId
Get user reviews.

#### POST /api/reviews
Create a review (requires authentication).

### Support (`/api/support`)

#### POST /api/support/tickets
Create support ticket (requires authentication).

#### GET /api/support/tickets
Get user's support tickets (requires authentication).

### Admin (`/api/admin`)

#### GET /api/admin/users
Get all users (requires ADMIN role).

#### PUT /api/admin/users/:id/kyc
Verify user KYC (requires ADMIN role).

#### GET /api/admin/analytics
Get system analytics (requires ADMIN role).

#### GET /api/admin/move-in/issues
Get move-in issues (requires ADMIN role).

### System (`/api/system`)

#### GET /api/system/status
Get system health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

## Development Notes

### Mock Payment System
- Use `MOCK` payment gateway for development
- Mock payments always succeed
- No real payment processing required

### WebSocket Events
- Real-time messaging via Socket.IO
- Connection: `ws://localhost:3001`
- Events: `message`, `notification`, `typing`

### File Uploads
- Use `multipart/form-data` for file uploads
- Supported formats: images, PDFs
- Max file size: 10MB

### Frontend API Client
```javascript
import api from '../utils/api';

// The frontend uses a centralized axios instance
// with automatic JWT token injection and error handling
api.get('/move-in/offers/123/status')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

## Key Features

### Move-In Verification System
- **Extended Window**: From payment date until 2 days after expected move-in date
- **Three Phases**: PRE_MOVE_IN, WINDOW_OPEN, WINDOW_CLOSED
- **Issue Reporting**: Tenants can report problems during the entire move-in window

### Payment Gateways
- **Stripe**: Credit card processing
- **PayU**: Polish payment gateway
- **Przelewy24**: Bank transfer integration
- **TPay**: Mobile payments
- **Mock**: Development/testing mode

### User Roles
- **TENANT**: Default role, can post rental requests and accept offers
- **LANDLORD**: Can list properties and make offers on tenant requests
- **ADMIN**: System administration and user management

---

*This API documentation reflects the actual implementation as of January 2025. All endpoints and request/response formats are verified against the real codebase.* 