# 🏠 TenantDashboardRent Component Documentation

## Overview
The `TenantDashboardRent` component provides tenants with a comprehensive view of their rent payment history and rental property status. It displays payment information, overdue payments, and locked rental notifications.

## 🎯 Features

### Core Functionality:
- **Rent Payment History**: View all rent payments for accepted offers
- **Payment Status Tracking**: See payment status (Pending, Paid, Failed, Overdue)
- **Overdue Payment Highlighting**: Red highlighting for overdue payments
- **Locked Rental Notifications**: Clear warnings when rentals are locked
- **Property Information**: Display rental property details and lease information

### Visual Elements:
- **Status Badges**: Color-coded payment status indicators
- **Overdue Warnings**: Red highlighting for overdue payments
- **Locked Notifications**: Prominent warnings for locked rentals
- **Payment Cards**: Clean, organized payment history display

## 🔧 Backend Integration

### API Endpoint:
- **Route**: `GET /api/my-rents`
- **Authentication**: Required (JWT token)
- **Role**: Tenant only
- **Response**: Array of rent data with payment history

### Response Structure:
```json
{
  "rentData": [
    {
      "offerId": "string",
      "rentalRequest": {
        "id": "string",
        "title": "string",
        "location": "string",
        "status": "ACTIVE|LOCKED",
        "isLocked": boolean
      },
      "rentAmount": number,
      "leaseStartDate": "date",
      "leaseEndDate": "date",
      "rentPayments": [
        {
          "id": "string",
          "amount": number,
          "status": "PENDING|SUCCEEDED|FAILED",
          "dueDate": "date",
          "paidDate": "date|null",
          "month": number,
          "year": number
        }
      ]
    }
  ]
}
```

## 🎨 Component Structure

### Main Sections:

1. **Header Section**
   - Page title: "My Rent Payments"
   - Description: "View and manage your rent payment history"
   - Refresh button

2. **Error Handling**
   - Error message display
   - Loading spinner
   - Empty state message

3. **Rental Property Cards**
   - Property information header
   - Locked status indicator
   - Lease date range
   - Payment history section

4. **Payment History**
   - Monthly payment cards
   - Status badges
   - Due dates and payment dates
   - Overdue indicators

### Key Functions:

#### `fetchRentPayments()`
- Fetches rent payment data from backend
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

#### `getPaymentStatusBadge(status, dueDate)`
- Returns appropriate status badge
- Handles overdue logic
- Color-coded status indicators

#### `isPaymentOverdue(payment)`
- Checks if payment is overdue
- Compares current date with due date
- Only considers PENDING payments

## 🎯 User Experience

### Visual Hierarchy:
1. **Property Level**: Each rental property gets its own card
2. **Payment Level**: Individual payment entries within each property
3. **Status Level**: Clear status indicators for each payment

### Color Coding:
- **Green**: Paid payments
- **Yellow**: Pending payments
- **Red**: Overdue payments
- **Purple**: Locked rentals

### Responsive Design:
- Mobile-friendly layout
- Responsive grid system
- Flexible card layouts

## 🔄 State Management

### Component State:
```javascript
const [rentData, setRentData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

### State Updates:
- **Loading**: During API calls
- **Error**: When API calls fail
- **Data**: When rent data is successfully fetched

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

## 🧪 Testing Scenarios

### Test Cases:

1. **Empty State**
   - No rent payments
   - Shows appropriate message

2. **Active Rentals**
   - Multiple properties
   - Various payment statuses
   - Overdue payments

3. **Locked Rentals**
   - Locked property display
   - Warning messages
   - Status indicators

4. **Payment History**
   - Multiple months
   - Different payment statuses
   - Date formatting

### Error Handling:
- Network errors
- Authentication failures
- Invalid data responses

## 🚀 Usage

### Route Configuration:
```javascript
<Route 
  path="/my-rents" 
  element={
    <ProtectedRoute>
      <TenantDashboardRent />
    </ProtectedRoute>
  } 
/>
```

### Navigation:
- Added to Navbar for tenants
- Purple color scheme
- "My Rents" label

### Access Control:
- Protected route (requires authentication)
- Tenant role only
- Automatic redirect for unauthorized users

## 📊 Data Flow

### 1. Component Mount
- `useEffect` triggers `fetchRentPayments()`
- Sets loading state to true

### 2. API Call
- Makes authenticated request to `/api/my-rents`
- Handles response or error

### 3. State Update
- Updates `rentData` with response
- Sets loading to false
- Clears any previous errors

### 4. Rendering
- Maps through rent data
- Renders property cards
- Displays payment history

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
- Additional payment actions can be added
- Export functionality could be implemented
- Payment reminders could be integrated

## 🐛 Troubleshooting

### Common Issues:

1. **No Data Displayed**
   - Check if tenant has accepted offers
   - Verify lease dates are set
   - Check API endpoint response

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check user role is TENANT
   - Ensure proper authentication flow

3. **Date Formatting Issues**
   - Check browser locale settings
   - Verify date string format
   - Test with different date formats

### Debug Commands:
```javascript
// Check API response
console.log('Rent payments response:', response.data);

// Check component state
console.log('Rent data:', rentData);

// Check authentication
console.log('User:', user);
```

## 📈 Future Enhancements

### Potential Improvements:
1. **Payment Actions**: Pay rent directly from dashboard
2. **Export Features**: Download payment history as PDF
3. **Notifications**: Email reminders for upcoming payments
4. **Analytics**: Payment trends and statistics
5. **Filters**: Filter by date range or status
6. **Search**: Search through payment history

### API Enhancements:
- Pagination for large payment histories
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