# 👨‍💼 AdminDashboard Component Documentation

## Overview
The `AdminDashboard` component provides administrators with comprehensive oversight of the Smart Rental System, including user management, rental request monitoring, payment tracking, and system administration capabilities.

## 🎯 Features

### Core Functionality:
- **User Management**: View all users with roles and registration dates
- **Rental Oversight**: Monitor all rental requests and their status
- **Payment Tracking**: View all payments across the platform
- **Lock Management**: Manually lock/unlock rental requests
- **Cron Job Control**: Trigger daily rent check manually
- **Role-based Access**: Only accessible to users with ADMIN role

### Admin Actions:
- **Manual Lock/Unlock**: Control rental access directly
- **Daily Cron Trigger**: Manually run the daily rent check
- **Data Refresh**: Update all dashboard data in real-time
- **System Monitoring**: View platform statistics and activity

## 🔧 Backend Integration

### API Endpoints:
- **GET /api/admin/users**: Fetch all users
- **GET /api/admin/rentals**: Fetch all rental requests
- **GET /api/admin/payments**: Fetch all payments
- **PUT /api/admin/rentals/:id/lock-status**: Update rental lock status
- **POST /api/admin/trigger-daily-check**: Trigger daily cron job

### Authentication:
- **JWT Token**: Required for all admin endpoints
- **Role Check**: Only ADMIN users can access
- **Middleware**: `verifyToken` + `requireAdmin`

## 🎨 Component Structure

### Main Sections:

1. **Header Section**
   - Page title: "Admin Dashboard"
   - Description: "Manage users, rentals, and payments across the platform"

2. **Admin Actions Panel**
   - Trigger Daily Cron Job button
   - Refresh Data button
   - Loading states for actions

3. **Tabbed Interface**
   - Users tab (with count)
   - Rentals tab (with count)
   - Payments tab (with count)

4. **Data Tables**
   - Responsive table layouts
   - Status badges and role indicators
   - Action buttons for rentals

### Key Functions:

#### `fetchData()`
- Fetches all admin data in parallel
- Handles loading states and errors
- Updates component state

#### `handleLockRental(rentalId, shouldLock)`
- Updates rental lock status
- Refreshes rentals data
- Shows success/error feedback

#### `triggerDailyCron()`
- Triggers daily rent check
- Shows loading state
- Refreshes data after completion

#### `formatDate(dateString)`
- Formats dates for display
- Uses locale-specific formatting

#### `formatCurrency(amount)`
- Formats currency in PLN
- Uses Polish locale formatting

#### `getStatusBadge(status)`
- Returns appropriate status badge
- Color-coded status indicators
- Includes icons for visual clarity

#### `getRoleBadge(role)`
- Returns role-specific badge
- Color-coded role indicators
- Clear role identification

## 🎯 User Experience

### Visual Hierarchy:
1. **Admin Actions**: Quick access to system functions
2. **Tab Navigation**: Easy switching between data types
3. **Data Tables**: Organized information display
4. **Action Buttons**: Clear call-to-action elements

### Color Coding:
- **Red**: Admin actions and locked rentals
- **Green**: Unlocked rentals and successful payments
- **Blue**: General information and actions
- **Purple**: Admin-specific elements
- **Yellow**: Pending statuses

### Status Indicators:
- **Users**: Role badges (Admin, Landlord, Tenant)
- **Rentals**: Status badges (Active, Locked, Inactive)
- **Payments**: Status badges (Pending, Paid, Failed)

### Responsive Design:
- Mobile-friendly table layouts
- Responsive tab navigation
- Flexible action button layouts

## 🔄 State Management

### Component State:
```javascript
const [activeTab, setActiveTab] = useState('users');
const [users, setUsers] = useState([]);
const [rentals, setRentals] = useState([]);
const [payments, setPayments] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [actionLoading, setActionLoading] = useState(false);
const [cronLoading, setCronLoading] = useState(false);
```

### State Updates:
- **Loading**: During API calls
- **Error**: When API calls fail
- **Data**: When admin data is successfully fetched
- **Actions**: During lock/unlock operations
- **Cron**: During daily cron job execution

## 🛠️ Technical Implementation

### Dependencies:
- React hooks (useState, useEffect)
- React Router (for navigation)
- AuthContext (for API calls)
- Tailwind CSS (for styling)

### API Integration:
- Uses `useAuth()` hook for authenticated API calls
- Handles JWT token automatically
- Error handling for network issues

### Performance:
- Efficient rendering with React keys
- Minimal re-renders
- Optimized data fetching

## 📊 Data Display

### Users Tab:
- **Name**: User's full name
- **Email**: User's email address
- **Role**: Role badge (Admin, Landlord, Tenant)
- **Created**: Registration date and time

### Rentals Tab:
- **Title**: Rental request title
- **Status**: Current status with badge
- **Tenant**: Tenant name and information
- **Landlord**: Landlord name and information
- **Actions**: Lock/Unlock buttons

### Payments Tab:
- **Tenant**: User who made the payment
- **Amount**: Payment amount in PLN
- **Status**: Payment status with badge
- **Purpose**: Payment purpose (RENT, DEPOSIT)
- **Date**: Payment creation date

## 🧪 Testing Scenarios

### Test Cases:

1. **Admin Access**
   - Admin user can access dashboard
   - Non-admin users see access denied
   - Proper role-based routing

2. **Data Fetching**
   - All tabs load data correctly
   - Error handling for failed requests
   - Loading states display properly

3. **Admin Actions**
   - Lock/unlock rental requests
   - Trigger daily cron job
   - Refresh data functionality

4. **UI Interactions**
   - Tab switching works correctly
   - Action buttons respond properly
   - Status badges display correctly

### Error Handling:
- Network errors
- Authentication failures
- Invalid data responses
- Action failures

## 🚀 Usage

### Route Configuration:
```javascript
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### Navigation:
- Added to Navbar for admin users
- Red color scheme for admin identification
- "Admin" link label

### Access Control:
- Protected route (requires authentication)
- Admin role only
- Automatic redirect for unauthorized users

## 📊 Data Flow

### 1. Component Mount
- `useEffect` checks user role
- If admin, triggers `fetchData()`
- Sets loading state to true

### 2. API Calls
- Makes authenticated requests to admin endpoints
- Handles response or error
- Updates state with fetched data

### 3. State Update
- Updates data arrays with response
- Sets loading to false
- Clears any previous errors

### 4. Rendering
- Shows appropriate tab content
- Displays data in tables
- Shows action buttons

### 5. User Actions
- Lock/unlock rental requests
- Trigger daily cron job
- Refresh dashboard data

## 🔧 Customization

### Styling:
- Tailwind CSS classes
- Responsive design
- Color scheme can be modified

### Functionality:
- Additional admin actions can be added
- More data tabs can be implemented
- Export functionality could be added

### Features:
- User management actions
- Payment processing controls
- System configuration options

## 🐛 Troubleshooting

### Common Issues:

1. **Access Denied**
   - Check user role is ADMIN
   - Verify JWT token is valid
   - Ensure proper authentication flow

2. **Data Not Loading**
   - Check admin endpoints are working
   - Verify API responses
   - Check network connectivity

3. **Actions Not Working**
   - Check admin permissions
   - Verify endpoint availability
   - Check action parameters

### Debug Commands:
```javascript
// Check user role
console.log('User role:', user.role);

// Check API responses
console.log('Users:', users);
console.log('Rentals:', rentals);
console.log('Payments:', payments);

// Check action states
console.log('Action loading:', actionLoading);
console.log('Cron loading:', cronLoading);
```

## 📈 Future Enhancements

### Potential Improvements:
1. **User Management**: Edit user roles, delete users
2. **Payment Controls**: Process refunds, adjust payments
3. **System Settings**: Configure platform settings
4. **Analytics**: View platform statistics
5. **Export Features**: Download data reports
6. **Real-time Updates**: WebSocket integration

### API Enhancements:
- Bulk operations for users/rentals
- Advanced filtering and search
- Data export endpoints
- System configuration endpoints

## 🎯 Best Practices

### Code Organization:
- Separate concerns (data fetching, formatting, rendering)
- Reusable utility functions
- Clear component structure

### Error Handling:
- Graceful error display
- User-friendly error messages
- Fallback states for missing data

### Performance:
- Efficient re-renders
- Optimized data fetching
- Minimal API calls

### Security:
- Proper role validation
- Secure API endpoints
- Input validation

## 📊 Business Logic

### Admin Permissions:
- **View All Data**: Access to all users, rentals, payments
- **Lock Management**: Control rental access
- **System Control**: Trigger cron jobs
- **Data Oversight**: Monitor platform activity

### Action Authorization:
- **Lock/Unlock**: Only admins can control rental access
- **Cron Trigger**: Only admins can trigger system jobs
- **Data Access**: Only admins can view all platform data

### Data Privacy:
- **User Information**: Admins can view all user data
- **Payment Details**: Admins can view all payment information
- **Rental Information**: Admins can view all rental requests

## 🔍 Monitoring

### Key Metrics:
- Number of users by role
- Rental request status distribution
- Payment success rates
- System activity levels

### Admin Actions:
- Lock/unlock frequency
- Cron job execution
- Data refresh patterns
- Error occurrence rates

### Reports:
- User registration trends
- Rental request activity
- Payment processing statistics
- System performance metrics

## 📋 Component Checklist

### ✅ Implemented Features:
- [x] Fetch all users, rentals, and payments
- [x] Display 3 tabs with data tables
- [x] Allow manual lock/unlock rental requests
- [x] Trigger daily cron job manually
- [x] Add authentication check for ADMIN role
- [x] Add route: /admin
- [x] Add "Admin" link in navbar for admin users
- [x] Responsive design with Tailwind CSS
- [x] Error handling and loading states
- [x] Real-time data refresh
- [x] Status badges and role indicators

### 🔄 Future Enhancements:
- [ ] User management actions (edit, delete)
- [ ] Payment processing controls
- [ ] System configuration options
- [ ] Data export functionality
- [ ] Advanced filtering and search
- [ ] Real-time updates
- [ ] Analytics dashboard
- [ ] Bulk operations 