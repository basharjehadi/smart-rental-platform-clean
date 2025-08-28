# Smart Rental System API Documentation

## Overview

The Smart Rental System API provides a comprehensive set of endpoints for managing rental properties, users, payments, and contracts. This document outlines all available endpoints, their parameters, and expected responses.

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

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "TENANT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "TENANT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/login
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
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "TENANT"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/logout
Logout user (requires authentication).

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /auth/me
Get current user information (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "TENANT",
    "profileImage": "url_to_image",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Social Authentication

#### GET /auth/google
Initiate Google OAuth login.

#### GET /auth/google/callback
Google OAuth callback (handled automatically).

#### GET /auth/facebook
Initiate Facebook OAuth login.

#### GET /auth/facebook/callback
Facebook OAuth callback (handled automatically).

### Properties

#### GET /properties
Get all properties with optional filtering.

**Query Parameters:**
- `city` (string): Filter by city
- `minRent` (number): Minimum rent amount
- `maxRent` (number): Maximum rent amount
- `bedrooms` (number): Number of bedrooms
- `furnished` (boolean): Furnished property
- `petsAllowed` (boolean): Pets allowed
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "property_id",
        "title": "Modern Apartment",
        "description": "Beautiful apartment in city center",
        "address": "123 Main St",
        "city": "Warsaw",
        "postalCode": "00-001",
        "rentAmount": 2500,
        "depositAmount": 2500,
        "bedrooms": 2,
        "bathrooms": 1,
        "area": 65,
        "furnished": true,
        "parking": false,
        "petsAllowed": true,
        "availableFrom": "2024-02-01T00:00:00.000Z",
        "utilitiesIncluded": false,
        "landlord": {
          "id": "landlord_id",
          "name": "Jane Smith"
        },
        "images": ["url1", "url2"],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### POST /properties
Create a new property (requires LANDLORD role).

**Request Body:**
```json
{
  "title": "Modern Apartment",
  "description": "Beautiful apartment in city center",
  "address": "123 Main St",
  "city": "Warsaw",
  "postalCode": "00-001",
  "rentAmount": 2500,
  "depositAmount": 2500,
  "bedrooms": 2,
  "bathrooms": 1,
  "area": 65,
  "furnished": true,
  "parking": false,
  "petsAllowed": true,
  "availableFrom": "2024-02-01T00:00:00.000Z",
  "utilitiesIncluded": false
}
```

#### GET /properties/:id
Get property details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "property_id",
    "title": "Modern Apartment",
    "description": "Beautiful apartment in city center",
    "address": "123 Main St",
    "city": "Warsaw",
    "postalCode": "00-001",
    "rentAmount": 2500,
    "depositAmount": 2500,
    "bedrooms": 2,
    "bathrooms": 1,
    "area": 65,
    "furnished": true,
    "parking": false,
    "petsAllowed": true,
    "availableFrom": "2024-02-01T00:00:00.000Z",
    "utilitiesIncluded": false,
    "landlord": {
      "id": "landlord_id",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+48123456789"
    },
    "images": ["url1", "url2"],
    "videos": ["video_url"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /properties/:id
Update property (requires LANDLORD role and ownership).

**Request Body:** (same as POST, but all fields optional)

#### DELETE /properties/:id
Delete property (requires LANDLORD role and ownership).

### Rental Requests

#### POST /rental-requests
Create a rental request (requires TENANT role).

**Request Body:**
```json
{
  "title": "Looking for 2-bedroom apartment",
  "description": "I'm looking for a modern 2-bedroom apartment in Warsaw",
  "location": "Warsaw",
  "moveInDate": "2024-02-01T00:00:00.000Z",
  "budget": 3000,
  "bedrooms": 2,
  "bathrooms": 1,
  "furnished": true,
  "parking": false,
  "petsAllowed": true
}
```

#### GET /rental-requests
Get all rental requests (filtered by user role).

**Query Parameters:**
- `status` (string): Filter by status (ACTIVE, INACTIVE, LOCKED)
- `page` (number): Page number
- `limit` (number): Items per page

<!-- Removed: GET /my-requests (tenants manage via UI and dashboard summary) -->

#### GET /rental-requests/:id
Get rental request details.

### Offers

#### POST /offers
Create an offer for a rental request (requires LANDLORD role).

**Request Body:**
```json
{
  "rentalRequestId": "request_id",
  "propertyId": "property_id",
  "rentAmount": 2500,
  "depositAmount": 2500,
  "leaseDuration": 12,
  "description": "Perfect match for your requirements",
  "availableFrom": "2024-02-01T00:00:00.000Z",
  "utilitiesIncluded": false
}
```

#### GET /offers
Get offers (filtered by user role).

#### GET /offers/:requestId
Get offers for a specific rental request.

#### PUT /offers/:id/accept
Accept an offer (requires TENANT role).

#### PUT /offers/:id/reject
Reject an offer (requires TENANT role).

### Payments

#### POST /payments/create-intent
Create a Stripe payment intent.

**Request Body:**
```json
{
  "amount": 2500,
  "purpose": "RENT",
  "rentalRequestId": "request_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "payment_id",
    "amount": 2500,
    "purpose": "RENT"
  }
}
```

#### POST /payments/confirm
Confirm payment completion.

**Request Body:**
```json
{
  "paymentId": "payment_id",
  "stripePaymentIntentId": "pi_xxx"
}
```

#### GET /payments/history
Get payment history (requires authentication).

### Contracts

#### GET /contracts
Get contracts (filtered by user role).

#### GET /contracts/:id
Get contract details.

#### POST /contracts/:id/sign
Sign a contract (requires authentication).

**Request Body:**
```json
{
  "signature": "base64_signature_data"
}
```

#### GET /contracts/:id/download
Download contract PDF.

### File Upload

#### POST /upload/profile-image
Upload profile image (requires authentication).

**Form Data:**
- `image`: Image file (max 2MB)

#### POST /upload/property-images
Upload property images (requires LANDLORD role).

**Form Data:**
- `images`: Multiple image files (max 5MB each)
- `propertyId`: Property ID

#### POST /upload/identity-document
Upload identity document (requires authentication).

**Form Data:**
- `document`: Document file (PDF, DOC, DOCX)
- `type`: Document type

### Admin Endpoints

#### GET /admin/users
Get all users (requires ADMIN role).

#### GET /admin/statistics
Get system statistics (requires ADMIN role).

#### POST /admin/trigger-daily-check
Manually trigger daily rent check (requires ADMIN role).

### Health Check

#### GET /health
Get system health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
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

## Rate Limiting

API requests are rate-limited to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## Webhooks

### Stripe Webhook
**Endpoint:** `POST /stripe-webhook`

Handles Stripe payment events automatically. Configure in Stripe Dashboard with the following events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

## SDKs and Libraries

### JavaScript/Node.js
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Python
```python
import requests

class SmartRentalAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        
        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}'
            })
    
    def get_properties(self, **params):
        response = self.session.get(f'{self.base_url}/properties', params=params)
        return response.json()
```

## Support

For API support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the error logs 