# Move-In Issue System Documentation

## Overview

The Move-In Issue System provides a comprehensive three-way communication platform for tenants, landlords, and administrators to report, discuss, and resolve issues that arise during the move-in process. This system replaces the previous simple issue reporting with a full-featured communication thread.

## Move-In Window System

The system implements a flexible move-in window that provides comprehensive coverage for issue reporting:

- **Window Opens**: From the payment date (when tenant pays for the offer)
- **Window Closes**: 2 days after the expected move-in date
- **Duration**: Covers the entire period from payment to post-move-in

### Window Phases

1. **PRE_MOVE_IN**: Before payment date - window not yet open
2. **WINDOW_OPEN**: From payment date until 2 days after move-in date - issues can be reported
3. **WINDOW_CLOSED**: After 2 days past move-in date - no new issues can be reported

### Benefits of Extended Window

- **Early Issue Detection**: Problems can be reported during property visits before move-in
- **Flexible Timing**: Accommodates early move-ins, delayed move-ins, and post-move-in discoveries
- **Comprehensive Coverage**: No gaps in protection during the critical move-in period
- **Reduced Stress**: No pressure to find all issues within a 24-hour window

## Features

- **One Issue Per Rental**: Only one move-in issue is allowed per rental - for serious problems that warrant contract cancellation
- **Three-way Communication**: Tenants, landlords, and admins can all participate in issue discussions
- **Real-time Notifications**: Automatic notifications when new comments are added or status changes
- **Status Tracking**: Issues can be tracked through OPEN → IN_PROGRESS → RESOLVED → CLOSED

- **Rich User Profiles**: Full author information including names, roles, and profile images
- **Authorization Control**: Users can only access issues related to their leases
- **Evidence Upload**: Support for images, videos, PDFs, and documents in comments
- **File Management**: Visual file previews, download links, and file type detection
- **Admin Decision System**: Binding decisions that automatically affect rental requests and refunds
- **Property Hold Management**: Automatic property holds with landlord update requirements
- **Minor Issues**: Non-serious problems should be discussed through the live messaging system

## Database Schema

### MoveInIssue Model

```prisma
model MoveInIssue {
  id          String               @id @default(cuid())
  title       String
  description String
  status      MoveInIssueStatus    @default(OPEN)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  
  // Relations
  leaseId     String
  lease       Lease                @relation("LeaseMoveInIssues", fields: [leaseId], references: [id], onDelete: Cascade)
  
  // Comments for three-way communication
  comments    MoveInIssueComment[]
  
  // Admin decision fields
  adminDecision     String?     // "ACCEPTED", "REJECTED", "ESCALATED"
  adminDecisionAt   DateTime?
  adminDecisionBy   String?     // Admin user ID
  adminNotes        String?     // Admin's reasoning
  refundAmount      Float?      // Amount to refund if approved
  propertyHoldUntil DateTime?   // Property hold period end date
  
  // Indexes for performance
  @@index([leaseId])
  @@index([status])
  @@index([createdAt])
  @@index([adminDecision])
  @@map("move_in_issues")
}
```

### MoveInIssueComment Model

```prisma
model MoveInIssueComment {
  id        String      @id @default(cuid())
  content   String
  createdAt DateTime    @default(now())
  
  // Evidence support
  evidence  String[]    // Array of file paths
  evidenceType EvidenceType?  // IMAGE, DOCUMENT, VIDEO
  
  // Relations
  authorId  String
  author    User        @relation("UserMoveInIssueComments", fields: [authorId], references: [id], onDelete: Cascade)
  issueId   String
  issue     MoveInIssue @relation(fields: [issueId], references: [id], onDelete: Cascade)
  
  // Indexes for performance
  @@index([authorId])
  @@index([issueId])
  @@index([createdAt])
  @@map("move_in_issue_comments")
}
```

### Enums

```prisma
enum MoveInIssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
  ADMIN_APPROVED    // Admin accepted the issue
  ADMIN_REJECTED    // Admin rejected the issue
  ESCALATED         // Needs further review
}



enum EvidenceType {
  IMAGE
  DOCUMENT
  VIDEO
}
```

## API Endpoints

### 1. Create Move-In Issue

**POST** `/api/move-in-issues`

Creates a new move-in issue for a specific lease.

**Request Body:**
```json
{
  "leaseId": "string",
  "title": "string",
  "description": "string"
}
```

**Authorization:**
- Tenant members of the lease's tenant group
- Landlord (owner) of the property
- Admin users

**Window Validation:**
- Issues can only be created when the move-in window is open
- Window opens from payment date and closes 2 days after expected move-in date
- Returns error if window is not yet open or has already closed

**One Issue Limit:**
- Only one move-in issue is allowed per rental
- Returns error if an issue already exists for this offer
- Additional concerns should be discussed through live messaging system

**Response:**
```json
{
  "success": true,
  "message": "Move-in issue created successfully",
  "issue": {
              "id": "string",
     "title": "string",
     "description": "string",
     "status": "OPEN",
     "leaseId": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "lease": { /* lease details */ },
    "comments": []
  }
}
```

### 2. Get Move-In Issue

**GET** `/api/move-in-issues/:issueId`

Retrieves a single move-in issue with all comments and author profiles.

**Authorization:**
- Tenant members of the lease's tenant group
- Landlord (owner) of the property
- Admin users

**Response:**
```json
{
  "success": true,
  "issue": {
    "id": "string",
    "title": "string",
    "description": "string",
    "status": "string",
    "leaseId": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "lease": { /* lease details */ },
    "comments": [
      {
        "id": "string",
        "content": "string",
        "createdAt": "datetime",
        "author": {
          "id": "string",
          "name": "string",
          "role": "string",
          "profileImage": "string",
          "firstName": "string",
          "lastName": "string"
        }
      }
    ]
  }
}
```

### 3. Create Comment

**POST** `/api/move-in-issues/:issueId/comments`

Adds a new comment to an existing move-in issue.

**Request Body:**
```json
{
  "content": "string"
}
```

**Authorization:**
- Tenant members of the lease's tenant group
- Landlord (owner) of the property
- Admin users

**Response:**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "comment": {
    "id": "string",
    "content": "string",
    "createdAt": "datetime",
    "authorId": "string",
    "issueId": "string",
    "author": {
      "id": "string",
      "name": "string",
      "role": "string",
      "profileImage": "string",
      "firstName": "string",
      "lastName": "string"
    }
  }
}
```

### 4. Update Issue Status

**PUT** `/api/move-in-issues/:issueId/status`

Updates the status of a move-in issue.

**Request Body:**
```json
{
  "status": "IN_PROGRESS" // OPEN, IN_PROGRESS, RESOLVED, CLOSED
}
```

**Authorization:**
- Tenant members of the lease's tenant group
- Landlord (owner) of the property
- Admin users

**Response:**
```json
{
  "success": true,
  "message": "Issue status updated successfully",
  "issue": { /* updated issue with comments */ }
}
```

### 5. List Lease Move-In Issues

**GET** `/api/leases/:leaseId/move-in-issues`

Lists all move-in issues for a specific lease.

### 6. Get Tenant Move-In Issues

**GET** `/api/tenant-dashboard/move-in-issues`

Lists all move-in issues for the authenticated tenant across all their leases.

**Authorization:**
- Tenant users only

**Response:**
```json
{
  "success": true,
  "issues": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "leaseId": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "lease": {
        "property": {
          "id": "string",
          "name": "string",
          "address": "string"
        }
      },
      "comments": [
        {
          "id": "string",
          "content": "string",
          "createdAt": "datetime",
          "author": { /* author details */ }
        }
      ]
    }
  ]
}
```

### 7. Admin Decision on Move-In Issue

**POST** `/api/move-in-issues/:issueId/admin-decision`

Allows administrators to make binding decisions on move-in issues.

**Request Body:**
```json
{
  "decision": "ACCEPTED" | "REJECTED" | "ESCALATED",
  "notes": "string (optional)",
  "refundAmount": 1500.00 (required for ACCEPTED decisions)
}
```

**Authorization:**
- Admin users only

**Response:**
```json
{
  "success": true,
  "message": "Move-in issue accepted successfully",
  "issue": {
    "id": "string",
    "status": "ADMIN_APPROVED",
    "adminDecision": "ACCEPTED",
    "adminDecisionAt": "datetime",
    "adminDecisionBy": "string",
    "adminNotes": "string",
    "refundAmount": 1500.00,
    "propertyHoldUntil": "datetime"
  }
}
```

**Automatic Actions (for ACCEPTED decisions):**
- Rental request/lease status → `CANCELLED`
- Property status → `HOLD`
- Refund processing initiated
- Property hold period set (30 days)
- Notifications sent to all participants

**Authorization:**
- Tenant members of the lease's tenant group
- Landlord (owner) of the property
- Admin users

**Response:**
```json
{
  "success": true,
  "issues": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "leaseId": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "comments": [
        {
          "id": "string",
          "content": "string",
          "createdAt": "datetime",
          "author": { /* author details */ }
        }
      ]
    }
  ]
}
```

## Admin Decision System

### Overview

The Admin Decision System provides administrators with binding authority to resolve move-in issues that affect the underlying rental agreements. When an admin makes a decision, the system automatically performs all necessary actions to implement that decision.

### Decision Types

1. **ACCEPTED** - Issue is valid, tenant gets refund, rental request cancelled
2. **REJECTED** - Issue is invalid, tenant must proceed with move-in
3. **ESCALATED** - Issue needs further investigation

### Automatic Processing

When an admin **ACCEPTS** a move-in issue:

- ✅ **Rental Request Cancelled**: Lease status automatically set to `CANCELLED`
- ✅ **Full Refund Processed**: Tenant receives complete refund of all payments
- ✅ **Property Placed on Hold**: Property status set to `HOLD` for 30 days
- ✅ **Landlord Notified**: Automatic notification about property hold requirements
- ✅ **Tenant Notified**: Confirmation of refund processing

When an admin **REJECTS** a move-in issue:

- ❌ **Issue Marked as Rejected**: Status set to `ADMIN_REJECTED`
- ❌ **No Refund Provided**: Tenant must proceed with move-in
- ❌ **Rental Request Continues**: No changes to existing agreement

When an admin **ESCALATES** a move-in issue:

- 🔍 **Status Set to Escalated**: Requires additional review
- 🔍 **No Immediate Action**: System waits for further decision
- 🔍 **Investigation Required**: Additional admin review needed

### Property Hold Management

Properties with accepted move-in issues are automatically placed on hold:

- **Hold Duration**: 30 days from admin decision
- **Landlord Requirements**: Must update property listing during hold period
- **Automatic Release**: Property becomes available after hold period expires
- **Update Notifications**: Landlords receive reminders about listing updates

## Evidence Upload System

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP (up to 50MB)
- **Videos**: MP4, MOV, AVI, WebM (up to 50MB)
- **Documents**: PDF, DOC, DOCX (up to 50MB)

### File Upload Limits
- **Maximum files per comment**: 5 files
- **Maximum file size**: 50MB per file
- **Total upload size**: 250MB per comment

### Evidence Features
- **Automatic file type detection** based on MIME type
- **Visual previews** for images and videos
- **Download links** for all file types
- **File management** with remove capability before submission
- **Secure storage** in `/uploads/move_in_evidence/` directory

### Frontend Integration
- **Drag & drop** file selection interface
- **File preview** with thumbnail generation
- **Progress indicators** during upload
- **Error handling** for invalid file types and sizes
- **Responsive design** for mobile and desktop

## Authorization Rules

### Tenant Access
- Can view and comment on issues for leases where they are a member of the tenant group
- Can create new issues for their leases
- Can update issue status
- Can upload evidence files with comments

### Landlord Access
- Can view and comment on issues for properties they own
- Can create new issues for their properties
- Can update issue status
- Can upload evidence files with comments

### Admin Access
- Can view and comment on all issues
- Can create issues for any lease
- Can update any issue status
- Can upload evidence files with comments

## Notifications

The system automatically creates notifications for:

1. **New Issue Created**: All participants (tenants and landlord) are notified
2. **New Comment Added**: All other participants are notified
3. **Status Updated**: All participants are notified of status changes

Notification types:
- `SYSTEM_ANNOUNCEMENT` for issue-related updates
- Includes issue title and relevant context

## Frontend Integration

### Components Implemented

1. **PropertyCard**: Enhanced to show move-in issue badges on properties with open issues
2. **LandlordMoveInIssuePage**: Complete issue detail page with chat-style interface
3. **Move-In Issue Badge**: Prominent red badge linking directly to issue details
4. **Status Management**: Real-time status updates with visual feedback
5. **Comment System**: Full chat-style communication thread
6. **MoveInIssueCommentThread**: Enhanced reusable comment thread component with evidence upload support
7. **AdminMoveInIssues**: Updated admin UI with interactive comment thread and decision system
8. **AdminDecisionModal**: Modal component for admins to make binding decisions
9. **TenantMoveInIssuePage**: New tenant page for viewing and participating in issue discussions
10. **TenantDashboard Integration**: Move-in issues section showing all tenant issues

### Reusable Component Architecture

The **MoveInIssueCommentThread** component serves as the foundation for all move-in issue interfaces:

- **Unified Experience**: Consistent UI and behavior across admin, landlord, and tenant interfaces
- **Configurable Features**: Toggle status updates, comment forms, and user role display
- **Real-time Updates**: Immediate UI feedback for all actions
- **Responsive Design**: Mobile-friendly layout with proper spacing and typography
- **Accessibility**: Proper form labels, error handling, and loading states

### Enhanced Evidence Upload Features

The component now includes comprehensive evidence upload capabilities:

- **File Selection**: Multiple file picker with drag-and-drop support
- **File Validation**: Type and size validation with user-friendly error messages
- **File Preview**: Thumbnail previews for images, icons for documents
- **File Management**: Remove individual files before submission
- **Upload Progress**: Visual feedback during file upload process
- **Evidence Display**: Rich rendering of uploaded evidence in comment threads

### Admin Decision Display

The component now shows comprehensive admin decision information:

- **Decision Status**: Visual indicators for ACCEPTED, REJECTED, and ESCALATED decisions
- **Decision Details**: Timestamp, admin notes, and decision reasoning
- **Refund Information**: Display of refund amounts for accepted issues
- **Property Hold**: Information about property hold periods and requirements
- **Decision History**: Complete audit trail of admin decisions

### Components Still Needed

1. **MoveInIssueForm**: Create new issues
2. **CommentForm**: Reusable component for adding comments (can use MoveInIssueCommentThread)
3. **IssueStatusSelector**: Reusable component for status updates (can use MoveInIssueCommentThread)

## Landlord Dashboard Integration

### Property List Enhancement

The landlord dashboard now includes move-in issue data for each property:

- **Backend Query**: Properties are fetched with associated leases and open move-in issues
- **Issue Badge**: Red "Move-In Issue Reported" badge appears on property cards with open issues
- **Direct Navigation**: Clicking the badge navigates to `/landlord/issue/:issueId`
- **Real-time Updates**: Badge visibility updates based on issue status changes

### Issue Detail Page Features

The new `/landlord/issue/:issueId` route provides:

- **Issue Overview**: Title, description, priority, status, and timestamps
- **Status Management**: Buttons to update issue status (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- **Comment Thread**: Chat-style display of all comments with author information
- **Real-time Communication**: Form to add new comments with immediate UI updates
- **User Role Display**: Visual indicators for tenant, landlord, and admin comments
- **Responsive Design**: Mobile-friendly layout with proper spacing and typography

## Admin UI Integration

### Enhanced AdminMoveInIssues Page

The admin move-in issues page has been completely upgraded:

- **Modern List View**: Clean, organized display of all move-in issues with status and priority badges
- **Interactive Comment Thread**: Click "View Details" to see the full issue with comment thread
- **Real-time Updates**: Admins can add comments and update issue status directly from the interface
- **Comprehensive Issue Information**: Property details, tenant information, and issue metadata
- **Status Management**: Full control over issue workflow (OPEN → IN_PROGRESS → RESOLVED → CLOSED)

### Admin Features

- **Issue Overview**: Title, description, priority, status, timestamps, and participant information
- **Comment Participation**: Admins can add comments to any issue for guidance and updates
- **Status Control**: Admins can update issue status to reflect current progress
- **User Role Display**: Clear visual indicators showing who made each comment
- **Navigation**: Easy back-and-forth between issue list and detailed views

## Tenant UI Integration

### New TenantMoveInIssuePage

Tenants now have a dedicated page for move-in issue management:

- **Route**: `/tenant/issue/:issueId` - Accessible from tenant dashboard
- **Full Issue View**: Complete issue details with description and metadata
- **Comment Participation**: Tenants can view all comments and add their own responses
- **Status Updates**: Tenants can update issue status to reflect resolution progress
- **Real-time Communication**: Immediate updates when comments are added or status changes

### Tenant Dashboard Integration

The tenant dashboard now includes a dedicated move-in issues section:

- **Issues Overview**: List of all move-in issues associated with the tenant's rental requests
- **Status Tracking**: Visual status indicators (OPEN, IN_PROGRESS, RESOLVED, CLOSED, ADMIN_APPROVED, ADMIN_REJECTED, ESCALATED)
- **Quick Access**: "View Details" button navigates directly to issue discussion
- **Comment Count**: Shows number of comments for each issue
- **Property Context**: Displays which property and rental request each issue relates to
- **Real-time Updates**: Issues appear immediately after creation with automatic refresh

### Tenant Features

- **Issue Discovery**: See all reported issues for their properties
- **Communication**: Participate in three-way discussions with landlords and admins
- **Progress Tracking**: Monitor issue resolution status and updates
- **Documentation**: Keep records of all issue-related communications
- **Resolution**: Mark issues as resolved when problems are fixed

### State Management

```javascript
const [issues, setIssues] = useState([]);
const [selectedIssue, setSelectedIssue] = useState(null);
const [comments, setComments] = useState([]);
const [loading, setLoading] = useState(false);
```

### API Calls

```javascript
// Create issue
const createIssue = async (issueData) => {
  const response = await api.post('/move-in-issues', issueData);
  return response.data;
};

// Get issue with comments
const getIssue = async (issueId) => {
  const response = await api.get(`/move-in-issues/${issueId}`);
  return response.data.issue;
};

// Add comment
const addComment = async (issueId, content) => {
  const response = await api.post(`/move-in-issues/${issueId}/comments`, { content });
  return response.data.comment;
};

// Update status
const updateStatus = async (issueId, status) => {
  const response = await api.put(`/move-in-issues/${issueId}/status`, { status });
  return response.data.issue;
};

// Get landlord dashboard with move-in issues (enhanced)
const getLandlordDashboard = async () => {
  const response = await api.get('/landlord-dashboard');
  return response.data; // Now includes moveInIssues array
};
```

### Enhanced Backend Queries

The landlord dashboard controller now includes:

```javascript
// Properties with leases and move-in issues
const properties = await prisma.property.findMany({
  where: { organization: { members: { some: { userId: landlordId } } } },
  include: {
    leases: {
      include: {
        moveInIssues: {
          where: { status: 'OPEN' },
          include: {
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { author: { select: { id: true, name: true, role: true, profileImage: true } } }
            }
          }
        }
      }
    }
  }
});
```

## Error Handling

### Common Error Responses

```json
{
  "error": "Unauthorized",
  "message": "You are not authorized to view this issue"
}
```

```json
{
  "error": "Move-in issue not found",
  "message": "The specified move-in issue does not exist"
}
```

```json
{
  "error": "Missing required fields",
  "message": "Lease ID, title, and description are required"
}
```

```json
{
  "error": "Move-in issue already exists",
  "message": "Only one move-in issue is allowed per rental. Please use the live messaging system for additional concerns."
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `403` - Forbidden (unauthorized)
- `404` - Not Found
- `500` - Internal Server Error

## Backend Implementation

### File Upload Handling

The backend now supports evidence uploads through enhanced endpoints:

- **Multer Integration**: Uses existing uploadMiddleware with move-in evidence support
- **File Storage**: Files stored in `/uploads/move_in_evidence/` directory
- **File Validation**: Server-side validation of file types and sizes
- **Database Integration**: Evidence paths and types stored in MoveInIssueComment model
- **Security**: File type restrictions and size limits enforced

### Enhanced API Endpoints

The comment creation endpoint now handles multipart form data:

```javascript
// POST /api/move-in-issues/:issueId/comments
// Accepts: multipart/form-data with 'evidence' files and 'content' text
// Returns: Comment with evidence array and evidenceType
```

## Performance Considerations

### Database Indexes

- `leaseId` - For filtering issues by lease
- `status` - For filtering by status
- `createdAt` - For sorting and date-based queries
- `authorId` - For filtering comments by author
- `issueId` - For filtering comments by issue

### Query Optimization

- Comments are loaded with pagination (latest comment for list views)
- Full comment history loaded only when viewing issue details
- User profile data is selectively included to minimize payload size

## Security Features

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **Authorization Checks**: Users can only access issues related to their leases
3. **Input Validation**: All input is validated and sanitized
4. **SQL Injection Protection**: Prisma ORM provides built-in protection
5. **Rate Limiting**: Consider implementing rate limiting for comment creation

## Testing

### Test Cases

1. **Authorization Tests**
   - Tenant can only access their own lease issues
   - Landlord can only access their property issues
   - Admin can access all issues

2. **CRUD Operations**
   - Create, read, update issue status
   - Create, read comments
   - Proper error handling for invalid data

3. **Evidence Upload Tests**
   - File upload with valid file types
   - File size validation (max 50MB)
   - File count validation (max 5 files)
   - Evidence display in comment threads
   - File download functionality

4. **Admin Decision Tests**
   - Admin can make ACCEPTED decisions with refund amounts
   - Admin can make REJECTED decisions
   - Admin can ESCALATE issues for further review
   - Automatic rental request cancellation for accepted issues
   - Property hold period enforcement
   - Refund processing notifications
   - Decision validation and error handling

5. **Notification Tests**
   - Notifications sent to correct participants
   - Notification content is accurate

6. **Edge Cases**
   - Empty comment content
   - Invalid status values
   - Non-existent issue IDs
   - Invalid file types
   - Oversized files

## Future Enhancements

1. **File Attachments**: Support for images and documents in comments
2. **Email Notifications**: Send email notifications in addition to in-app notifications
3. **Issue Templates**: Predefined issue types for common problems
4. **Escalation Rules**: Automatic escalation for high-priority issues
5. **Integration**: Connect with maintenance request system
6. **Analytics**: Track issue resolution times and patterns

## Migration from Old System

**✅ COMPLETED: The old move-in issue system has been completely removed.**

The new system has replaced all functionality from the old system:
- **Old ReportMoveInIssueModal** → **Removed**
- **Old `/move-in/offers/:id/report-issue` endpoint** → **Removed**
- **Old cancellationReason/cancellationEvidence fields** → **Replaced with new MoveInIssue model**
- **Old admin dashboard move-in issues section** → **Replaced with new AdminMoveInIssues page**

All users now use the new unified move-in issue system with full three-way communication capabilities.

## Support

For technical support or questions about the Move-In Issue System, please refer to the development team or create a support ticket through the existing support system.
