# Monthly Payment System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Payment Flow](#payment-flow)
6. [Frontend Components](#frontend-components)
7. [Backend Controllers](#backend-controllers)
8. [Mock Payment System](#mock-payment-system)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Data Consistency Fixes](#data-consistency-fixes)
12. [Tenant vs Landlord Views](#tenant-vs-landlord-views)
13. [Future Implementation](#future-implementation)

## Overview

The Monthly Payment System is a comprehensive solution for handling monthly rent payments in the Smart Rental System. It provides a seamless payment experience for tenants while giving landlords real-time visibility into payment status and revenue.

## Key Features

- **Monthly Rent Payments**: Automated monthly rent collection on the 10th of each month
- **Mock Payment Integration**: Complete mock payment system for testing
- **Payment History Tracking**: Comprehensive payment history for both tenants and landlords
- **Upcoming Payments**: Dynamic generation of future payment schedules
- **Real-time Status Updates**: Immediate payment status updates across the system
- **Unified payment data consistency**: Single source of truth for all payment-related data
- **Landlord Filtering**: Accurate payment data filtered by landlord property ownership

## Architecture

The system follows a layered architecture with clear separation of concerns:

```
Frontend (React) → Backend (Express.js) → Payment Service → Database (PostgreSQL)
```

### Core Components:
- **Frontend**: React components for payment pages and dashboards
- **Backend**: Express.js controllers and routes
- **Payment Service**: Centralized payment data management (`paymentService.js`)
- **Database**: PostgreSQL with Prisma ORM

## Database Schema

### Key Tables:
- **`Payment`**: General payments (deposits, first month, etc.)
- **`RentPayment`**: Monthly rent payments
- **`User`**: Tenant and landlord information
- **`Offer`**: Rental agreements
- **`Property`**: Property details

### Payment Status Enums:
- `SUCCEEDED`: Payment completed successfully
- `PENDING`: Payment awaiting completion
- `FAILED`: Payment failed

### Payment Purpose Enums:
- `DEPOSIT_AND_FIRST_MONTH`: Initial deposit and first month
- `RENT`: Monthly rent payments
- `OTHER`: Miscellaneous payments

## Payment Flow

### 1. Monthly Payment Process
1. Tenant navigates to monthly payment page
2. System validates active lease and upcoming payments
3. Tenant initiates payment through mock payment system
4. Payment is processed and recorded in database
5. Payment history and upcoming payments are updated
6. Success page confirms payment completion

### 2. Data Flow
```
Tenant Payment → Payment Controller → Database Update → Unified Service → Frontend Update
```

## Frontend Components

### 1. MonthlyRentPaymentPage
- **Purpose**: Main payment interface for monthly rent
- **Features**: 
  - Payment amount display
  - Landlord information
  - Mock payment integration
  - Responsive design

### 2. PaymentSuccessPage
- **Purpose**: Confirmation page after successful payment
- **Features**:
  - Payment confirmation details
  - Landlord profile picture
  - Navigation options
  - Success animations

### 3. PaymentHistory
- **Purpose**: Display payment history for tenants
- **Features**:
  - Payment timeline
  - Amount and status display
  - Upcoming payments
  - Total paid calculation

## Backend Controllers

### 1. PaymentController
- **Purpose**: Handle payment processing and creation
- **Key Functions**:
  - `createMockPaymentIntent`: Create mock payment intent
  - `completeMockPayment`: Complete mock payment
  - `getPaymentHistory`: Retrieve payment history

### 2. TenantDashboardController
- **Purpose**: Provide tenant dashboard data
- **Key Functions**:
  - `getTenantDashboardData`: Main dashboard data
  - `getTenantPaymentHistory`: Payment history with upcoming payments
  - **Uses**: `getUnifiedPaymentData(tenantId)` for consistent data

### 3. LandlordTenantController
- **Purpose**: Provide landlord view of tenant details
- **Key Functions**:
  - `getLandlordTenantDetails`: Detailed tenant information
  - **Uses**: `getUnifiedPaymentData(tenantId, landlordId)` for filtered data

### 4. LandlordDashboardController
- **Purpose**: Provide landlord dashboard overview
- **Key Functions**:
  - `getLandlordDashboardData`: Dashboard overview
  - **Uses**: `getLandlordPaymentData(landlordId)` for landlord-specific data

## Mock Payment System

### 1. Payment Intent Creation
```javascript
// Creates a mock payment intent
POST /api/payments/mock-payment-intent
{
  "amount": 3500,
  "purpose": "RENT",
  "rentalRequestId": "uuid"
}
```

### 2. Payment Completion
```javascript
// Completes the mock payment
POST /api/payments/complete-mock-payment
{
  "paymentIntentId": "uuid",
  "status": "SUCCEEDED"
}
```

### 3. Integration Points
- **Frontend**: Mock payment popup and processing
- **Backend**: Payment intent creation and completion
- **Database**: Payment record creation and status updates

## Testing

### 1. Payment Flow Testing
```bash
# Test complete payment flow
node test-payment-flow.js
```

### 2. Data Consistency Testing
```bash
# Test unified payment service
node test-unified-service.js
```

### 3. Manual Testing Steps
1. **Tenant Payment**: Complete monthly rent payment
2. **Payment History**: Verify payment appears in history
3. **Upcoming Payments**: Verify next payment is updated
4. **Landlord View**: Verify landlord sees correct payment data

## Troubleshooting

### Common Issues:

#### 1. Payment Not Appearing in History
- **Cause**: Database transaction failure
- **Solution**: Check backend logs for errors
- **Prevention**: Ensure proper error handling in payment completion

#### 2. Upcoming Payments Not Updating
- **Cause**: Payment status not properly updated
- **Solution**: Verify payment completion process
- **Prevention**: Use unified service for data consistency

#### 3. Data Mismatch Between Views
- **Cause**: Inconsistent data sources
- **Solution**: Use unified payment service
- **Prevention**: All controllers now use centralized service

## Data Consistency Fixes

### Problem Identified
The system had data consistency issues where:
- **Tenant View**: Showed 35,000 zł (deposit + first month + rent payments)
- **Landlord View**: Incorrectly showed 35,000 zł instead of 14,000 zł (only rent payments)
- **Root Cause**: Mixed logic in controllers, double-counting payments, inconsistent filtering

### Solution Implemented

#### 1. Unified Payment Service (`paymentService.js`)
Created a centralized service that provides:
- **`getUnifiedPaymentData(userId, landlordId?)`**: Consistent payment data for tenants and landlords
- **`getLandlordPaymentData(landlordId)`**: Landlord-specific payment overview
- **`getPaymentStatus(userId)`**: Consistent payment status calculation
- **`getUpcomingPayments(userId)`**: Dynamic upcoming payment generation

#### 2. Controller Updates
All payment-related controllers now use the unified service:
- **`tenantDashboardController.js`**: Uses `getUnifiedPaymentData(tenantId)`
- **`landlordTenantController.js`**: Uses `getUnifiedPaymentData(tenantId, landlordId)`
- **`landlordDashboardController.js`**: Uses `getLandlordPaymentData(landlordId)`

#### 3. Data Filtering Logic
- **Tenant View**: Shows all payments (general + rent)
- **Landlord View**: Shows only payments related to their properties
- **No More Double-Counting**: Proper filtering prevents duplicate calculations

### Benefits of Data Consistency Fixes
1. **Single Source of Truth**: All payment data comes from one service
2. **Accurate Filtering**: Landlords see only relevant payment data
3. **Maintainable Code**: Easy to update payment logic in one place
4. **Scalable Architecture**: Easy to add new payment types or filtering

## Tenant vs Landlord Views

### Tenant View (No Landlord Filtering)
**Purpose**: Show tenant their complete payment history
**Data Source**: `getUnifiedPaymentData(tenantId)`
**Shows**:
- **Total Paid**: 35,000 zł (deposit + first month + rent payments)
- **Payment Types**: All payments (general + rent)
- **Payment History**: Complete timeline of all payments
- **Upcoming Payments**: Future monthly rent due dates

**Example Data**:
```json
{
  "totalPaid": 35000,
  "payments": [
    {
      "description": "Deposit & First Month",
      "amount": 7000,
      "type": "general"
    },
    {
      "description": "Rent - October 2025",
      "amount": 3500,
      "type": "rent"
    }
    // ... more payments
  ]
}
```

### Landlord View (With Landlord Filtering)
**Purpose**: Show landlord only payments related to their properties
**Data Source**: `getUnifiedPaymentData(tenantId, landlordId)`
**Shows**:
- **Total Paid**: 14,000 zł (only rent payments for their property)
- **Payment Types**: Only rent payments related to their properties
- **Payment History**: Filtered payment timeline
- **Revenue Overview**: Accurate income from their properties

**Example Data**:
```json
{
  "totalPaid": 14000,
  "payments": [
    {
      "description": "Rent - October 2025",
      "amount": 3500,
      "type": "rent"
    }
    // ... only rent payments
  ]
}
```

### Why Different Totals?
The different totals are **correct behavior**:

1. **Tenant View (35,000 zł)**:
   - 21,000 zł from general payments (deposit + first month + other)
   - 14,000 zł from rent payments (4 monthly payments × 3,500 zł)

2. **Landlord View (14,000 zł)**:
   - 0 zł from general payments (deposit/first month not related to their property)
   - 14,000 zł from rent payments (monthly rent for their property)

This ensures landlords only see revenue from their properties while tenants see their complete payment history.

## Future Implementation

### 1. Real Payment Gateway Integration
When implementing real payment gateways (Stripe, PayPal, etc.):

1. **Replace Mock Payment System**:
   - Update `PaymentController` to use real gateway APIs
   - Implement webhook handling for payment status updates
   - Add proper error handling and retry logic

2. **Maintain Data Consistency**:
   - Keep using unified payment service
   - Ensure real payments update the same database tables
   - Maintain landlord filtering logic

### 2. Additional Payment Types
To add new payment types:

1. **Update Database Schema**:
   - Add new `PaymentPurpose` enum values
   - Extend payment tables if needed

2. **Update Unified Service**:
   - Modify `getUnifiedPaymentData` to handle new types
   - Update filtering logic for new payment categories

3. **Update Controllers**:
   - Ensure new payment types are properly displayed
   - Maintain data consistency across views

### 3. Enhanced Reporting
Future enhancements could include:
- **Payment Analytics**: Revenue trends, payment patterns
- **Automated Invoicing**: PDF generation for payments
- **Multi-currency Support**: Handle different currencies
- **Advanced Filtering**: Date ranges, payment status filters

## Conclusion

The Monthly Payment System now provides:
- **Consistent Data**: Single source of truth for all payment data
- **Accurate Views**: Tenants see complete history, landlords see property-specific data
- **Maintainable Code**: Centralized payment logic in unified service
- **Scalable Architecture**: Easy to extend and modify

The data consistency fixes ensure that both tenants and landlords have accurate, reliable payment information, eliminating the confusion caused by mismatched totals and providing a solid foundation for future enhancements.
