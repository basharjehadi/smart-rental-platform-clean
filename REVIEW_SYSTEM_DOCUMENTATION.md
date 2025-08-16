# 🏠 Smart Rental System - Review System Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Review System Architecture](#review-system-architecture)
3. [3-Stage Review Process](#3-stage-review-process)
4. [Rating System & Calculations](#rating-system--calculations)
5. [User Ranking System](#user-ranking-system)
6. [User Experience Flow](#user-experience-flow)
7. [Technical Implementation](#technical-implementation)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)
10. [Security & Access Control](#security--access-control)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Smart Rental System implements a comprehensive **bidirectional review system** that allows both landlords and tenants to review each other at three key stages of the rental process. This system builds trust, provides authentic feedback, and helps users make informed decisions.

### Key Features
- ✅ **3-Stage Review Process**: Payment, Move-in, and Lease End
- ✅ **Bidirectional Reviews**: Both parties review each other
- ✅ **Weighted Rating System**: Different stages have different importance
- ✅ **Dynamic User Ranking**: Bronze, Silver, Gold, Platinum, Diamond tiers
- ✅ **Role-Specific Interface**: Different experiences for landlords vs tenants
- ✅ **Real-time Updates**: Ratings and ranks update automatically

---

## 🏗️ Review System Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • ReviewPage    │◄──►│ • ReviewService │◄──►│ • Reviews      │
│ • ReviewSystem  │    │ • RankService   │    │ • Users        │
│ • ReviewCard    │    │ • Controllers   │    │ • UserRanks    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Action** → Triggers review stage
2. **System** → Creates pending reviews for both parties
3. **Users** → Submit reviews with ratings and comments
4. **System** → Calculates weighted averages and updates ranks
5. **UI Updates** → Real-time display of new ratings and ranks

---

## 🔄 3-Stage Review Process

### Stage 1: Payment Completion
- **Trigger**: When tenant completes payment for a property
- **Weight**: **30%** of total rating
- **Purpose**: Assess financial responsibility and communication
- **Reviewers**: Both landlord and tenant review each other

### Stage 2: Move-in Experience
- **Trigger**: When tenant moves into the property
- **Weight**: **40%** of total rating
- **Purpose**: Evaluate property condition, move-in process, and initial interactions
- **Reviewers**: Both landlord and tenant review each other

### Stage 3: Lease End
- **Trigger**: When lease term expires
- **Weight**: **30%** of total rating
- **Purpose**: Assess overall experience, property maintenance, and relationship quality
- **Reviewers**: Both landlord and tenant review each other

### Stage Progression
```
New User (5.0) → Payment Stage → Move-in Stage → Lease End Stage
     ↓              ↓              ↓              ↓
Initial Rating → Updated Rating → Updated Rating → Final Rating
```

---

## ⭐ Rating System & Calculations

### Initial Rating
- **New Users**: Automatically receive **5.0 stars**
- **Reason**: Provides a starting point for new accounts
- **Duration**: Until first real review is submitted

### Weighted Rating Formula
```
Final Rating = (Payment × 0.30) + (Move-in × 0.40) + (Lease End × 0.30)
```

### Example Calculation
```
User receives:
- Payment Stage: 4 stars (4 × 0.30 = 1.2)
- Move-in Stage: 5 stars (5 × 0.40 = 2.0)
- Lease End: 3 stars (3 × 0.30 = 0.9)

Final Rating = 1.2 + 2.0 + 0.9 = 4.1 stars
```

### Rating Updates
- **Real-time**: Ratings update immediately after review submission
- **Cumulative**: Each stage builds upon previous ratings
- **Persistent**: Ratings remain even if users delete accounts

---

## 🏆 User Ranking System

### Ranking Tiers

#### 🥉 Bronze Tier
- **Landlords**: 50 points required
- **Tenants**: 75 points required
- **Benefits**: Basic trust indicator, community recognition

#### 🥈 Silver Tier
- **Landlords**: 150 points required
- **Tenants**: 200 points required
- **Benefits**: Enhanced visibility, priority in listings

#### 🥇 Gold Tier
- **Landlords**: 300 points required
- **Tenants**: 400 points required
- **Benefits**: Premium status, featured listings, trust badges

#### 💎 Platinum Tier
- **Landlords**: 500 points required
- **Tenants**: 600 points required
- **Benefits**: Elite status, exclusive features, priority support

#### 👑 Diamond Tier
- **Landlords**: 800 points required
- **Tenants**: 1000 points required
- **Benefits**: Legendary status, maximum trust, all premium features

### Point System

#### How Points Are Earned
```
Base Points:
├── Account Age: 1 point per month
├── Real Reviews Received: 10 points per review
├── Reviews Given: 5 points per review
├── Properties Managed (Landlords): 20 points per property
├── Completed Leases: 25 points per lease
└── Stage Completion: 15 points per completed stage
```

#### Point Calculation Example
```
Landlord with:
- 6 months account age: 6 points
- 5 reviews received: 50 points
- 3 reviews given: 15 points
- 2 properties: 40 points
- 1 completed lease: 25 points
- 2 completed stages: 30 points

Total: 166 points → Silver Tier
```

---

## 👥 User Experience Flow

### For Landlords

#### Dashboard Card
- **Title**: "Tenant Reviews"
- **Shows**: Current rating, rank, pending reviews
- **Action**: "View Full Tenant Review System"

#### Review Page
- **Header**: "Tenant Review System"
- **Subtitle**: "Review and rate your tenants"
- **Sections**:
  1. Current Rating & Rank (side by side)
  2. Pending Reviews (what needs to be reviewed)
  3. Tenant Reviews (reviews received and given)
  4. How the System Works (landlord-specific explanations)

### For Tenants

#### Dashboard Card
- **Title**: "Landlord Reviews"
- **Shows**: Current rating, rank, pending reviews
- **Action**: "View Full Landlord Review System"

#### Review Page
- **Header**: "Landlord Review System"
- **Subtitle**: "Review and rate your landlords"
- **Sections**:
  1. Current Rating & Rank (side by side)
  2. Pending Reviews (what needs to be reviewed)
  3. Landlord Reviews (reviews received and given)
  4. How the System Works (tenant-specific explanations)

### Review Submission Process
```
1. User sees pending review notification
2. Clicks "Write Review" button
3. Modal opens with rating and comment fields
4. User selects 1-5 stars and writes comment
5. Submits review
6. System updates ratings and ranks
7. UI refreshes with new data
```

---

## 🔧 Technical Implementation

### Frontend Components

#### ReviewSystem.jsx
- **Purpose**: Main review interface component
- **Props**: `userId`, `isLandlord`
- **Features**: 
  - Responsive grid layout
  - Role-specific content
  - Real-time data fetching
  - Modal review forms

#### ReviewCard.jsx
- **Purpose**: Dashboard summary component
- **Props**: `userId`, `isLandlord`
- **Features**:
  - Compact rating display
  - Pending review count
  - Navigation to full system

#### ReviewPage.jsx
- **Purpose**: Full review page wrapper
- **Features**:
  - Role-specific headers
  - Navigation controls
  - Responsive layout

### Backend Services

#### ReviewService
- **Methods**:
  - `initializeUserRating(userId)`: Sets initial 5-star rating
  - `createStageReview(data)`: Creates new stage review
  - `updateUserAverageRating(userId)`: Recalculates user rating
  - `triggerReviewByEvent(eventType, leaseId, tenantId)`: Triggers review stages

#### RankService
- **Methods**:
  - `calculateUserRank(userId)`: Determines user rank
  - `calculateRankPoints(user)`: Calculates total points
  - `determineRank(role, points, totalReviews)`: Maps points to rank

### State Management
```javascript
const [pendingReviews, setPendingReviews] = useState([]);
const [myRating, setMyRating] = useState(null);
const [userRank, setUserRank] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [showReviewForm, setShowReviewForm] = useState(false);
const [selectedReview, setSelectedReview] = useState(null);
```

---

## 🌐 API Endpoints

### Review Endpoints
```
POST   /api/reviews                    - Create new review
GET    /api/reviews/pending/:userId    - Get pending reviews
GET    /api/reviews/user/:userId/summary - Get user rating summary
PUT    /api/reviews/:id                - Update existing review
DELETE /api/reviews/:id                - Delete review
GET    /api/reviews/lease/:leaseId     - Get lease reviews
```

### User Endpoints
```
GET    /api/users/:userId/rank        - Get user rank information
GET    /api/users/profile              - Get user profile
```

### Authentication
- **Required**: JWT token in Authorization header
- **Format**: `Bearer <token>`
- **Middleware**: `verifyToken` on all protected routes

---

## 🗄️ Database Schema

### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaseId UUID NOT NULL REFERENCES leases(id),
  reviewerId UUID NOT NULL REFERENCES users(id),
  targetUserId UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewStage VARCHAR(50) NOT NULL,
  isSystemGenerated BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);
```

### Users Table (Review-related fields)
```sql
ALTER TABLE users ADD COLUMN rank UserRank DEFAULT 'NEW_USER';
ALTER TABLE users ADD COLUMN rankPoints INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN rankUpdatedAt TIMESTAMP DEFAULT now();
```

### UserRank Enum
```sql
CREATE TYPE UserRank AS ENUM (
  'NEW_USER',
  'BRONZE',
  'SILVER', 
  'GOLD',
  'PLATINUM',
  'DIAMOND'
);
```

---

## 🔒 Security & Access Control

### Authentication Requirements
- **All review operations**: Require valid JWT token
- **User verification**: Users can only access their own data
- **Role-based access**: Landlords see tenant reviews, tenants see landlord reviews

### Data Validation
- **Rating range**: 1-5 stars only
- **Comment length**: Maximum 1000 characters
- **Review stage**: Must be valid enum value
- **User ownership**: Users can only review people they've interacted with

### Rate Limiting
- **Review submission**: Maximum 1 review per stage per user
- **API calls**: Rate limited to prevent abuse
- **Spam protection**: Duplicate review detection

---

## 🚨 Troubleshooting

### Common Issues

#### "Failed to load review data"
- **Cause**: API endpoint not responding or authentication failure
- **Solution**: Check backend server status and token validity

#### Rating not updating
- **Cause**: Review submission failed or calculation error
- **Solution**: Check browser console for errors, verify API response

#### Rank not progressing
- **Cause**: Insufficient points or calculation error
- **Solution**: Verify point calculation logic and user activity

#### Pending reviews not showing
- **Cause**: No active lease stages or data fetch error
- **Solution**: Check lease status and review service logic

### Debug Steps
1. **Check browser console** for JavaScript errors
2. **Verify API responses** in Network tab
3. **Check backend logs** for server errors
4. **Verify database** for data consistency
5. **Test authentication** token validity

### Performance Optimization
- **Lazy loading**: Reviews load on demand
- **Caching**: User data cached locally
- **Debouncing**: API calls throttled
- **Pagination**: Large review lists paginated

---

## 📊 Metrics & Analytics

### System Performance
- **Review submission rate**: Average time to complete review
- **User engagement**: Percentage of users who complete reviews
- **Rating distribution**: Spread of ratings across stages
- **Rank progression**: User movement between tiers

### User Behavior
- **Completion rates**: How many users complete all stages
- **Rating patterns**: Common rating values and trends
- **Comment analysis**: Sentiment and feedback patterns
- **Stage performance**: Which stages have highest/lowest ratings

---

## 🔮 Future Enhancements

### Planned Features
- **Review templates**: Pre-written review suggestions
- **Photo attachments**: Visual evidence in reviews
- **Review responses**: Allow users to respond to reviews
- **Advanced analytics**: Detailed performance insights
- **Mobile optimization**: Enhanced mobile experience

### Integration Opportunities
- **Email notifications**: Automated review reminders
- **SMS alerts**: Text message notifications
- **Social sharing**: Share positive reviews on social media
- **Third-party verification**: External review validation

---

## 📞 Support & Maintenance

### System Monitoring
- **Health checks**: Regular API endpoint testing
- **Error tracking**: Automated error logging and alerting
- **Performance metrics**: Response time and throughput monitoring
- **User feedback**: In-app feedback collection

### Maintenance Schedule
- **Daily**: Automated backups and health checks
- **Weekly**: Performance review and optimization
- **Monthly**: Feature updates and bug fixes
- **Quarterly**: Security audit and system review

---

*This documentation is maintained by the Smart Rental System development team. For questions or updates, please contact the development team.*
