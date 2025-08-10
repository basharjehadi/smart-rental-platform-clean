# Offer-Based Chat System

## Overview

The Smart Rental System now uses an offer-based chat system similar to Messenger/Airbnb, where conversations are initiated through property offers rather than manual email inputs.

## How It Works

### 1. Conversation Creation by Offer

- **Endpoint**: `POST /api/messaging/conversations/by-offer/:offerId`
- **Purpose**: Finds or creates a unique conversation for the tenant–landlord pair of a specific offer
- **Returns**: 
  ```json
  {
    "conversationId": "...",
    "status": "PENDING|ACTIVE|ARCHIVED",
    "isLocked": true|false
  }
  ```
- **Logic**: 
  - If offer is **unpaid**, returns `isLocked=true`
  - If **paid**, ensures conversation `status=ACTIVE`

### 2. Eligible Chat Targets

- **Endpoint**: `GET /api/messaging/eligible`
- **Purpose**: Returns a list of eligible chat targets for the current user
- **Returns**: Array of `EligibleTarget` objects:
  ```json
  {
    "offerId": "...",
    "conversationId": "..." | null,
    "counterpartUserId": "...",
    "counterpartName": "...",
    "counterpartAvatar": "url-or-null",
    "propertyTitle": "...",
    "offerStatus": "PENDING|ACCEPTED|PAID|REJECTED",
    "isLocked": true|false
  }
  ```

### 3. Chat Security Rules

- **Payment Required**: Chat is only available after payment for security
- **Locked Conversations**: If `isLocked=true`, block Socket.IO join/send and REST send with `PAYMENT_REQUIRED`
- **Read-Only Mode**: Locked conversations can still be listed/opened in read-only mode

## Frontend Implementation

### Chat Selector Component

- **File**: `frontend/src/components/chat/ChatSelector.tsx`
- **Purpose**: Modal for selecting eligible chat targets
- **Features**:
  - Fetches eligible targets using `GET /api/messaging/eligible`
  - Displays offers with relevant details
  - Shows lock icons for unpaid offers
  - Auto-starts chat when `offerId` prop is provided

### Updated Pages

#### PaymentSuccessPage
- **File**: `frontend/src/pages/PaymentSuccessPage.jsx`
- **Change**: "Message Landlord" button now navigates to `/messaging?conversationId=new&offerId=${offer.id}`
- **Flow**: Automatically opens ChatSelector for the specific offer

#### MessagingPage
- **File**: `frontend/src/pages/MessagingPage.jsx`
- **Changes**:
  - Removed old email-based chat creation
  - Integrated new ChatSelector component
  - Handles URL parameters for offer-based chat initiation

### Chat Components

#### Chat.tsx
- **File**: `frontend/src/components/chat/Chat.tsx`
- **Features**:
  - Displays lock icon and "Locked" text when chat is disabled
  - Shows "Chat Locked" banner with lock icon
  - Disables message input when `isChatDisabled` is true

#### ConversationList.tsx
- **File**: `frontend/src/components/chat/ConversationList.tsx`
- **Features**:
  - Shows lock icons for locked conversations
  - Displays conversation status and offer payment status
  - Visual indicators for chat availability

#### MessageInput.tsx
- **File**: `frontend/src/components/chat/MessageInput.tsx`
- **Features**:
  - Shows banner when input is disabled: "Chat is locked until payment is completed"
  - Visual feedback for locked chat state

## Database Schema

### Updated Models

#### Offer Model
```prisma
model Offer {
  // ... existing fields
  tenantId                String
  tenant                  User            @relation("TenantOffers", fields: [tenantId], references: [id], onDelete: Cascade)
  // ... other fields
}
```

#### User Model
```prisma
model User {
  // ... existing fields
  tenantOffers             Offer[]         @relation("TenantOffers")
  // ... other fields
}
```

#### Conversation Model
```prisma
model Conversation {
  // ... existing fields
  offerId                 String?
  status                  String          @default("PENDING") // PENDING, ACTIVE, ARCHIVED
  offer                   Offer?          @relation(fields: [offerId], references: [id])
  // ... other fields
}
```

## Usage Examples

### Starting a Chat from Payment Success

1. User completes payment on PaymentSuccessPage
2. Clicks "Message Landlord" button
3. Navigates to `/messaging?conversationId=new&offerId=${offer.id}`
4. MessagingPage automatically opens ChatSelector
5. ChatSelector auto-starts chat for the specific offer
6. User is redirected to the conversation

### Manual Chat Initiation

1. User clicks "New Chat" button on MessagingPage
2. ChatSelector opens showing all eligible targets
3. User selects an offer from the list
4. ChatSelector calls `/api/messaging/conversations/by-offer/:offerId`
5. User is redirected to the conversation

## Security Features

- **Payment Gating**: Chat functionality is locked until payment is completed
- **Offer Validation**: Only users involved in an offer can access its conversation
- **Status Checking**: Conversations respect offer payment status
- **Visual Indicators**: Clear lock icons and banners show chat availability

## Benefits

1. **Security**: Prevents chat abuse by requiring payment
2. **User Experience**: No need to remember email addresses or create titles
3. **Context**: Conversations are automatically tied to specific property offers
4. **Consistency**: All chat interactions are offer-based
5. **Automation**: Conversation titles are auto-generated as "Counterpart Name — Property Title"
