# 🏢 LandlordRentOverview Component Documentation

## Overview
The `LandlordRentOverview` component provides landlords with a comprehensive dashboard to monitor all their tenants' rent payments, track payment status, and manage rental properties. It displays tenant information, payment history, and current rent status.

## 🎯 Features

### Core Functionality:
- **Tenant Overview**: View all tenants with accepted offers
- **Payment Status Tracking**: Monitor current month payment status (Paid/Unpaid/Overdue)
- **Payment Statistics**: Track total, paid, and pending payments
- **Overdue Alerts**: Highlight overdue payments with warnings
- **Property Information**: Display rental property details and lease information

### Visual Elements:
- **Summary Statistics**: Quick overview of tenant counts and payment status
- **Status Badges**: Color-coded payment status indicators
- **Tenant Cards**: Organized display of each tenant's information
- **Payment History**: Detailed payment records for each tenant

## 🔧 Backend Integration

### API Endpoint:
- **Route**: `GET /api/landlord-rents`
- **Authentication**: Required (JWT token)
- **Role**: Landlord only
- **Response**: Array of rent overview data with tenant information

### Response Structure:
```json
{
  "rentOverview": [
    {
      "offerId": "string",
      "rentalRequest": {
        "id": "string",
        "title": "string",
        "location": "string",
        "status": "ACTIVE|LOCKED",
        "isLocked": boolean,
        "tenant": {
          "id": "string",
          "name": "string",
          "email": "string"
        }
      },
      "tenant": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "rentAmount": number,
      "leaseStartDate": "date",
      "leaseEndDate": "date",
      "currentStatus": "PAID|UNPAID|OVERDUE",
      "currentPayment": {
        "id": "string",
        "amount": number,
        "status": "PENDING|SUCCEEDED|FAILED",
        "dueDate": "date",
        "paidDate": "date|null",
        "month": number,
        "year": number
      },
      "overduePayments": [...],
      "allPayments": [...],
      "totalPayments": number,
      "paidPayments": number,
      "pendingPayments": number
    }
  ]
}
```

## 🎨 Component Structure

### Main Sections:

1. **Header Section**
   - Page title: "Rent Overview"
   - Description: "Monitor rent payments from all your tenants"
   - Refresh button

2. **Summary Statistics**
   - Total tenants count
   - Paid this month count
   - Unpaid count
   - Overdue count

3. **Error Handling**
   - Error message display
   - Loading spinner
   - Empty state message

4. **Tenant Cards**
   - Tenant information header
   - Current payment status
   - Property details
   - Payment statistics

5. **Current Month Status**
   - Current month payment details
   - Status badges
   - Due dates and payment dates
   - Overdue indicators

### Key Functions:

#### `fetchRentOverview()`
- Fetches rent overview data from backend
- Handles loading states and errors
- Updates component state

#### `formatDate(dateString)`
- Formats dates for display
- Uses locale-specific formatting

#### `formatCurrency(amount)`
- Formats currency in PLN
- Uses Polish locale formatting

#### `getMonthName(month)`
- Converts month number to name
- Returns full month names

#### `getStatusBadge(status)`
- Returns appropriate status badge for current month
- Color-coded status indicators
- Includes icons for visual clarity

#### `getPaymentStatusBadge(status, dueDate)`
- Returns payment status badge
- Handles overdue logic
- Color-coded status indicators

#### `calculateDaysOverdue(dueDate)`
- Calculates days overdue for payments
- Used for overdue warnings

## 🎯 User Experience

### Visual Hierarchy:
1. **Summary Level**: Quick statistics overview
2. **Tenant Level**: Individual tenant cards
3. **Payment Level**: Current month payment details
4. **Status Level**: Clear status indicators

### Color Coding:
- **Green**: Paid payments and statistics
- **Yellow**: Pending payments and statistics
- **Red**: Overdue payments and warnings
- **Purple**: Navigation links

### Status Icons:
- ✅ Paid
- ⏳ Pending/Unpaid
- ⚠️ Overdue
- ❌ Failed

### Responsive Design:
- Mobile-friendly layout
- Responsive grid system
- Flexible card layouts

## 🔄 State Management

### Component State:
```javascript
const [rentOverview, setRentOverview] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [selectedTenant, setSelectedTenant] = useState(null);
```

### State Updates:
- **Loading**: During API calls
- **Error**: When API calls fail
- **Data**: When rent overview is successfully fetched

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
- Optimized date calculations

## 📊 Data Processing

### Backend Processing:
1. **Fetch Offers**: Get all accepted offers for landlord
2. **Calculate Current Month**: Determine current month/year
3. **Process Payments**: Find current month payment for each offer
4. **Determine Status**: Calculate PAID/UNPAID/OVERDUE status
5. **Calculate Statistics**: Count total, paid, pending payments

### Frontend Processing:
1. **Display Statistics**: Show summary counts
2. **Render Tenant Cards**: Display each tenant's information
3. **Show Current Status**: Highlight current month payment status
4. **Display Warnings**: Show overdue payment alerts

## 🧪 Testing Scenarios

### Test Cases:

1. **Empty State**
   - No tenants
   - Shows appropriate message

2. **Active Tenants**
   - Multiple tenants
   - Various payment statuses
   - Overdue payments

3. **Payment Statistics**
   - Different payment counts
   - Status calculations
   - Summary statistics

4. **Current Month Status**
   - Paid current month
   - Unpaid current month
   - Overdue current month

### Error Handling:
- Network errors
- Authentication failures
- Invalid data responses

## 🚀 Usage

### Route Configuration:
```javascript
<Route 
  path="/landlord-rents" 
  element={
    <ProtectedRoute>
      <LandlordRentOverview />
    </ProtectedRoute>
  } 
/>
```

### Navigation:
- Added to Navbar for landlords
- Purple color scheme
- "Rent Overview" label

### Access Control:
- Protected route (requires authentication)
- Landlord role only
- Automatic redirect for unauthorized users

## 📊 Data Flow

### 1. Component Mount
- `useEffect` triggers `fetchRentOverview()`
- Sets loading state to true

### 2. API Call
- Makes authenticated request to `/api/landlord-rents`
- Handles response or error

### 3. State Update
- Updates `rentOverview` with response
- Sets loading to false
- Clears any previous errors

### 4. Rendering
- Maps through rent overview data
- Renders summary statistics
- Displays tenant cards

## 🔧 Customization

### Styling:
- Tailwind CSS classes
- Responsive design
- Color scheme can be modified

### Functionality:
- Date formatting can be localized
- Currency formatting can be changed
- Status badges can be customized

### Features:
- Additional tenant actions can be added
- Export functionality could be implemented
- Payment reminders could be integrated

## 🐛 Troubleshooting

### Common Issues:

1. **No Data Displayed**
   - Check if landlord has accepted offers
   - Verify lease dates are set
   - Check API endpoint response

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check user role is LANDLORD
   - Ensure proper authentication flow

3. **Status Calculation Issues**
   - Check current month calculation
   - Verify payment date logic
   - Test with different date formats

### Debug Commands:
```javascript
// Check API response
console.log('Rent overview response:', response.data);

// Check component state
console.log('Rent overview:', rentOverview);

// Check authentication
console.log('User:', user);
```

## 📈 Future Enhancements

### Potential Improvements:
1. **Tenant Actions**: Contact tenant, send reminders
2. **Export Features**: Download rent reports as PDF
3. **Notifications**: Email alerts for overdue payments
4. **Analytics**: Payment trends and statistics
5. **Filters**: Filter by tenant, property, or status
6. **Search**: Search through tenant list

### API Enhancements:
- Pagination for large tenant lists
- Real-time updates with WebSocket
- Bulk payment operations
- Payment receipt generation

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
- Optimized date calculations
- Minimal API calls

### Accessibility:
- Semantic HTML structure
- ARIA labels for status indicators
- Keyboard navigation support

## 📊 Business Logic

### Status Calculation:
- **PAID**: Current month payment status is SUCCEEDED
- **UNPAID**: Current month payment status is PENDING and not overdue
- **OVERDUE**: Current month payment status is PENDING and overdue

### Statistics Calculation:
- **Total Payments**: Count of all rent payments
- **Paid Payments**: Count of payments with SUCCEEDED status
- **Pending Payments**: Count of payments with PENDING status

### Overdue Detection:
- Compares current date with payment due date
- Only considers PENDING payments
- Calculates days overdue for display

## 🔍 Monitoring

### Key Metrics:
- Number of active tenants
- Payment collection rate
- Overdue payment frequency
- Average days overdue

### Alerts:
- Overdue payment notifications
- Low payment collection rates
- Tenant communication needs

### Reports:
- Monthly rent collection reports
- Tenant payment history
- Overdue payment summaries 