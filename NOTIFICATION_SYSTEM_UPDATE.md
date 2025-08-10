# Notification System Update

## Overview
The notification system has been updated to separate business notifications from system notifications, providing a cleaner user experience.

## Architecture

### Header Bell (System Notifications Center)
- **Purpose**: Shows system notifications only
- **Types**:
  - `PAYMENT_CONFIRMED` - Payment success notifications
  - `PAYMENT_FAILED` - Payment failure notifications
  - `CONTRACT_UPDATED` - Contract modification notifications
  - `CONTRACT_SIGNED` - Contract completion notifications
  - `KYC_APPROVED` - KYC verification success
  - `KYC_REJECTED` - KYC verification failure
  - `PROPERTY_STATUS_CHANGED` - Property status updates
  - `SYSTEM_ANNOUNCEMENT` - System-wide announcements
  - `ACCOUNT_UPDATED` - Account information changes

### Left Sidebar (Business Notifications)
- **Purpose**: Shows business-specific notifications
- **Types**:
  - `NEW_RENTAL_REQUEST` - Tenant rental requests (Landlord view)
  - `NEW_OFFER` - Landlord offers (Tenant view)
  - `Messages` - Unread chat messages

## Implementation Details

### Frontend Changes
1. **NotificationHeader.tsx**
   - Filters out business notifications (`NEW_RENTAL_REQUEST`, `NEW_OFFER`)
   - Shows only system notifications count
   - Updated navigation logic for system notifications

2. **LandlordSidebar.jsx & TenantSidebar.jsx**
   - Integrated `useChat` hook for message notifications
   - Shows business notification counts in sidebar badges

### Backend Changes
1. **Prisma Schema**
   - Added new notification types to `NotificationType` enum
   - New migration: `20250810020000_add_system_notifications`

2. **NotificationService.js**
   - Added methods for creating system notifications
   - Payment, contract, KYC, property, and system announcements

3. **Notification Routes**
   - Updated validation to accept new notification types
   - Maintains backward compatibility

## Usage Examples

### Creating System Notifications
```javascript
// Payment notification
await NotificationService.createPaymentNotification(userId, paymentId, 'SUCCEEDED', amount);

// Contract notification
await NotificationService.createContractNotification(userId, contractId, 'SIGNED', title);

// KYC notification
await NotificationService.createKYCNotification(userId, 'APPROVED');

// Property status notification
await NotificationService.createPropertyStatusNotification(userId, propertyId, address, status);
```

### Frontend Integration
```javascript
// Header bell shows system notifications only
const systemNotificationsCount = counts.total - (counts.rentalRequests + counts.offers);

// Sidebar shows business notifications
const businessNotificationsCount = counts.rentalRequests + counts.offers;
```

## Benefits
1. **Clear Separation**: Business vs. system notifications
2. **Better UX**: Users know where to look for different types of information
3. **Scalability**: Easy to add new notification types
4. **Maintainability**: Cleaner code organization

## Migration Notes
- Existing notifications remain unchanged
- New notification types are automatically available
- Backward compatibility maintained
- No breaking changes to existing functionality
