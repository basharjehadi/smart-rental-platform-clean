# Smart Rental System - Payment-Based Chat System

## Overview
This system implements a **payment-based chat system** where tenants can only message landlords after they have successfully paid for a property. This ensures secure communication and prevents spam while allowing legitimate tenants to coordinate with landlords.

## Documentation

This project includes comprehensive documentation covering various aspects of the system:

### **API & Integration Documentation**
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference and endpoints
- [Organization API Implementation](docs/ORGANIZATION_API_IMPLEMENTATION.md) - Organization management features
- [Tenant Group API Implementation](docs/TENANT_GROUP_API_IMPLEMENTATION.md) - Tenant group functionality
- [Tenant Group UI Summary](docs/TENANT_GROUP_UI_SUMMARY.md) - Frontend tenant group features

### **Business Features Documentation**
- [Business Account Upgrade UI](docs/BUSINESS_ACCOUNT_UPGRADE_UI.md) - Business account management
- [Business Occupant Management](docs/BUSINESS_OCCUPANT_MANAGEMENT_SUMMARY.md) - Occupant management system
- [Monthly Payment System](docs/MONTHLY_PAYMENT_SYSTEM_DOCUMENTATION.md) - Payment processing documentation
- [Property Availability System](docs/PROPERTY_AVAILABILITY_SYSTEM.md) - Property availability management
- [Landlord Journey System](docs/LANDLORD_JOURNEY_SYSTEM.md) - Landlord onboarding and workflow
- [Request Pool System](docs/REQUEST_POOL_SYSTEM.md) - Rental request management system

### **System & Technical Documentation**
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - System deployment instructions
- [Docker Setup](docs/DOCKER_SETUP.md) - Docker configuration and setup
- [Hybrid Dev Setup](docs/HYBRID_DEV_SETUP.md) - Development environment configuration
- [Quick Start Guide](docs/QUICK_START.md) - Quick setup and getting started
- [Database Cleanup Guide](docs/DATABASE_CLEANUP_GUIDE.md) - Database maintenance procedures
- [Migration Summary](docs/MIGRATION_SUMMARY.md) - Database migration history
- [Lease Lifecycle](docs/LEASE_LIFECYCLE.md) - Lease management workflow

### **Contract & Legal Documentation**
- [Enhanced Contract Template](docs/ENHANCED_CONTRACT_TEMPLATE.md) - Contract generation system
- [Dynamic Contract Generation](docs/DYNAMIC_CONTRACT_GENERATION.md) - Automated contract creation
- [Refunds System](docs/REFUNDS.md) - Refund processing documentation

### **Development & Testing**
- [Messaging Tests](docs/README_MESSAGING_TESTS.md) - Messaging system testing
- [LibreTranslate Setup](docs/LIBRETRANSLATE_SETUP.md) - Translation service configuration
- [Updated Rental Request Logic](docs/UPDATED_RENTAL_REQUEST_LOGIC.md) - Rental request system updates
- [Review System Documentation](docs/REVIEW_SYSTEM_DOCUMENTATION.md) - Comprehensive review system guide
- [Chat System Documentation](docs/README_CHAT_SYSTEM.md) - Chat and messaging system overview

### **Admin & Management**
- [Admin Dashboard Documentation](docs/ADMIN_DASHBOARD_DOCUMENTATION.md) - Admin panel and management features

For detailed information about any specific feature or system component, please refer to the appropriate documentation file in the `/docs` directory.

## How It Works

### 1. **Payment-Based Chat Unlocking**
- **Before Payment**: Chat is completely locked - no messaging allowed
- **After Payment**: Chat unlocks immediately for the specific property
- **Chat is tied to properties**, not to offers
- **No manual email/title inputs** - everything is automated

### 2. **Conversation Creation**
- Conversations are created **by property ID** (not offer ID)
- System checks if user has **paid for the specific property**
- **Tenants**: Must have successful payment for the property
- **Landlords**: Must own the property and have tenants who paid
- Auto-generates conversation title: `"${Property Name}"`

### 3. **Eligible Chat Targets**
The system shows users only properties they can chat about:
- **For Tenants**: Properties they have paid for (deposit, rent, etc.)
- **For Landlords**: Properties they own where tenants have paid
- Each target shows: property name, counterpart name, payment details, unlock status

### 4. **Security Rules**
- **Payment Verification**: Only users with successful payments can chat
- **Property Ownership**: Landlords can only chat about properties they own
- **Role-Based Access**: Different logic for tenants vs landlords
- **No Bypass**: Chat remains locked until payment is confirmed

## Frontend Implementation

### **ChatSelector Component**
- **Purpose**: Modal for selecting which property to chat about
- **Data Source**: `GET /api/messaging/eligible` (payment-based)
- **Auto-Start**: Can automatically start chat if `propertyId` is provided
- **Visual Indicators**: Shows payment purpose, date, and unlock status

### **Updated Pages**
- **PaymentSuccessPage**: "Message Landlord" button navigates to property-based chat
- **MessagingPage**: Handles `propertyId` URL parameter for auto-starting chats
- **Chat Components**: Display lock icons and banners for payment status

### **Chat Components**
- **ConversationList**: Shows lock icons for locked conversations
- **MessageInput**: Disabled with banner when chat is locked
- **Chat Header**: Displays lock status and payment information

## Database Schema Updates

### **Key Relationships**
- **Payment** → **Offer** → **Property** (for tenant payments)
- **Property** → **Offer** → **Payment** (for landlord verification)
- **Conversation** → **Property** (ties conversations to properties)

### **Payment Types Supported**
- `DEPOSIT`: Security deposit payment
- `RENT`: Monthly rent payment  
- `DEPOSIT_AND_FIRST_MONTH`: Combined payment

## Usage Examples

### **Tenant Flow**
1. Tenant makes offer on property
2. Landlord accepts offer
3. Tenant pays deposit/rent
4. Payment confirmation page shows "Message Landlord" button
5. Clicking button unlocks chat for that property
6. Tenant can immediately start messaging landlord

### **Landlord Flow**
1. Landlord receives payment from tenant
2. Property appears in landlord's eligible chat targets
3. Landlord can start/continue conversation with paying tenant
4. Chat is always unlocked (tenant has already paid)

## Security Features

### **Payment Verification**
- Only `SUCCEEDED` payments unlock chat
- Multiple payment purposes supported
- Payment must be linked to specific property

### **Access Control**
- Tenants can only chat about properties they paid for
- Landlords can only chat about properties they own
- No cross-property chat access

### **Data Integrity**
- Conversations tied to specific properties
- Payment status verified on every chat access
- No manual override of payment requirements

## Benefits

### **For Tenants**
- **Immediate Access**: Chat unlocks right after payment
- **Clear Status**: Know exactly when they can message
- **No Confusion**: Simple property-based system

### **For Landlords**
- **Verified Tenants**: Only chat with paying customers
- **Property Management**: Chat organized by property
- **Payment Tracking**: See which properties have active tenants

### **For System**
- **Security**: Prevents unpaid chat access
- **Simplicity**: No complex offer-based logic
- **Scalability**: Easy to add new payment types
- **User Experience**: Clear, intuitive flow

## API Endpoints

### **GET /api/messaging/eligible**
Returns properties the current user can chat about based on payment status.

### **POST /api/messaging/conversations/by-property/:propertyId**
Creates or finds a conversation for a specific property, verifying payment access.

## Testing

### **Manual Test Commands**
```bash
# Test backend health
curl http://localhost:3001/health

# Test eligible targets (requires auth token)
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/messaging/eligible

# Test conversation creation (requires auth token)
curl -X POST -H "Authorization: Bearer <token>" http://localhost:3001/api/messaging/conversations/by-property/<propertyId>
```

### **Test Scenarios**
1. **Tenant without payment** → Chat should be locked
2. **Tenant with payment** → Chat should unlock immediately
3. **Landlord with paying tenant** → Should see tenant in eligible targets
4. **Landlord without paying tenant** → Should not see property in targets
5. **Payment verification** → Only SUCCEEDED payments unlock chat 

## Refunds (Move‑in Cancellation)

When support approves a tenant move‑in issue, the platform unwinds the booking and issues refunds.

What happens:
- Stripe: `refundOfferPayments(offerId)` calls Stripe’s Refund API per payment and marks our `Payment` as `CANCELLED` with the refund id recorded (in `errorMessage`, prefixed `REFUNDED:`).
- Mock gateways (dev): Payments are marked `CANCELLED` to represent a refund; real gateway integrations should implement refund APIs similarly to Stripe.

Key code:
- `backend/src/controllers/moveInVerificationController.js` → `adminApproveCancellation()` orchestrates unwind then calls `refundOfferPayments`.
- `backend/src/controllers/paymentController.js` → `refundOfferPayments()` performs provider‑aware refunds and emits realtime notifications.

Environment for live refunds:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` must be set.