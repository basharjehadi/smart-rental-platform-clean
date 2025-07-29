# 🏠 TenantRentHistory Component Documentation

## Overview
The `TenantRentHistory` component provides tenants with a detailed view of their rent payment history, including payment status, amounts, due dates, and the ability to pay pending or failed rent payments. It displays comprehensive payment information in a table format with clear status indicators.

## 🎯 Features

### Core Functionality:
- **Payment History Display**: Shows all rent payments in a detailed table
- **Payment Status Tracking**: Displays PENDING, SUCCEEDED, FAILED status with badges
- **Overdue Detection**: Highlights overdue payments in red
- **Payment Actions**: "Pay Now" button for pending/failed payments
- **Locked Rental Warnings**: Red warning banner for locked rentals
- **Payment Statistics**: Summary of total, paid, and pending payments

### Visual Elements:
- **Payment Table**: Organized table with payment details
- **Status Badges**: Color-coded payment status indicators
- **Overdue Highlights**: Red background for overdue payments
- **Warning Banners**: Red warning for locked rentals
- **Payment Statistics**: Summary cards with payment counts

## 🔧 Backend Integration

### API Endpoint:
- **Route**: `GET /api/my-rents` (reuses existing endpoint)
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
   - Page title: "My Rent History"
   - Description: "View your complete rent payment history"
   - Refresh button

2. **Error Handling**
   - Error message display
   - Loading spinner
   - Empty state message

3. **Rental Property Cards**
   - Property information header
   - Locked rental warnings
   - Payment history table
   - Payment statistics

4. **Payment Table**
   - Month and year
   - Payment amount
   - Due date
   - Payment status
   - Paid date
   - Action buttons

### Key Functions:

#### `fetchRentHistory()`
- Fetches rent history data from backend
- Handles loading states and errors
- Updates component state

#### `handlePayNow(paymentId, amount)`
- Creates payment intent for pending/failed payments
- Shows processing state
- Refreshes data after payment
- Handles payment errors

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
- Returns payment status badge
- Handles overdue logic
- Color-coded status indicators

#### `calculateDaysOverdue(dueDate)`
- Calculates days overdue for payments
- Used for overdue warnings

#### `isPaymentOverdue(payment)`
- Checks if a payment is overdue
- Compares current date with due date

## 🎯 User Experience

### Visual Hierarchy:
1. **Property Level**: Individual rental property cards
2. **Payment Level**: Detailed payment table
3. **Status Level**: Clear status indicators
4. **Action Level**: Payment buttons and actions

### Color Coding:
- **Green**: Paid payments and statistics
- **Yellow**: Pending payments and statistics
- **Red**: Overdue payments, failed payments, and warnings
- **Purple**: Navigation links

### Status Icons:
- ✅ Paid (SUCCEEDED)
- ⏳ Pending (PENDING)
- ❌ Failed (FAILED)
- ⚠️ Overdue (PENDING + overdue)

### Responsive Design:
- Mobile-friendly table layout
- Responsive card system
- Flexible payment table

## 🔄 State Management

### Component State:
```javascript
const [rentData, setRentData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [processingPayment, setProcessingPayment] = useState(null);
```

### State Updates:
- **Loading**: During API calls
- **Error**: When API calls fail
- **Data**: When rent history is successfully fetched
- **Processing**: During payment processing

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

### Payment Processing:
- Creates payment intent for pending/failed payments
- Shows processing state during payment
- Refreshes data after successful payment

### Performance:
- Efficient rendering with React keys
- Minimal re-renders
- Optimized date calculations

## 📊 Data Processing

### Backend Processing:
1. **Fetch Rent Data**: Get all rent data for tenant
2. **Process Payments**: Include all payment history
3. **Calculate Status**: Determine payment status
4. **Check Overdue**: Calculate overdue payments

### Frontend Processing:
1. **Display Properties**: Show each rental property
2. **Render Payments**: Display payment table
3. **Show Status**: Highlight payment status
4. **Enable Actions**: Show payment buttons

## 🧪 Testing Scenarios

### Test Cases:

1. **Empty State**
   - No rent data
   - Shows appropriate message

2. **Active Rentals**
   - Multiple rental properties
   - Various payment statuses
   - Overdue payments

3. **Payment Table**
   - Different payment statuses
   - Overdue calculations
   - Payment actions

4. **Locked Rentals**
   - Locked rental warnings
   - Red warning banners
   - Clear messaging

### Error Handling:
- Network errors
- Authentication failures
- Invalid data responses
- Payment processing errors

## 🚀 Usage

### Route Configuration:
```javascript
<Route 
  path="/my-rents" 
  element={
    <ProtectedRoute>
      <TenantRentHistory />
    </ProtectedRoute>
  } 
/>
```

### Navigation:
- Updated Navbar link for tenants
- Purple color scheme
- "My Rent History" label

### Access Control:
- Protected route (requires authentication)
- Tenant role only
- Automatic redirect for unauthorized users

## 📊 Data Flow

### 1. Component Mount
- `useEffect` triggers `fetchRentHistory()`
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
- Displays payment tables

### 5. Payment Processing
- User clicks "Pay Now"
- Creates payment intent
- Shows processing state
- Refreshes data on success

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
- Additional payment methods can be added
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

3. **Payment Processing Issues**
   - Check payment intent creation
   - Verify Stripe integration
   - Test with different payment amounts

4. **Status Calculation Issues**
   - Check current date logic
   - Verify payment date logic
   - Test with different date formats

### Debug Commands:
```javascript
// Check API response
console.log('Rent history response:', response.data);

// Check component state
console.log('Rent data:', rentData);

// Check payment processing
console.log('Processing payment:', processingPayment);
```

## 📈 Future Enhancements

### Potential Improvements:
1. **Payment Methods**: Multiple payment options
2. **Export Features**: Download payment history as PDF
3. **Notifications**: Email alerts for due payments
4. **Analytics**: Payment trends and statistics
5. **Filters**: Filter by property, status, or date range
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

## 📊 Business Logic

### Status Calculation:
- **SUCCEEDED**: Payment completed successfully
- **PENDING**: Payment not yet processed
- **FAILED**: Payment failed or was declined

### Overdue Detection:
- Compares current date with payment due date
- Only considers PENDING payments
- Calculates days overdue for display

### Payment Processing:
- Creates payment intent for pending/failed payments
- Shows processing state during payment
- Refreshes data after successful payment

## 🔍 Monitoring

### Key Metrics:
- Number of active rentals
- Payment completion rate
- Overdue payment frequency
- Average days overdue

### Alerts:
- Overdue payment notifications
- Failed payment alerts
- Locked rental warnings

### Reports:
- Monthly payment history
- Payment status summaries
- Overdue payment reports

## 🎨 UI/UX Design

### Table Design:
- Clean, organized table layout
- Responsive design for mobile
- Clear column headers
- Proper spacing and alignment

### Status Indicators:
- Color-coded status badges
- Icons for visual clarity
- Clear status text

### Action Buttons:
- Prominent "Pay Now" buttons
- Disabled state during processing
- Loading indicators

### Warning Banners:
- Red background for locked rentals
- Clear warning messages
- Actionable information

## 📱 Mobile Responsiveness

### Responsive Features:
- Horizontal scrolling for tables
- Stacked layout on mobile
- Touch-friendly buttons
- Readable text sizes

### Mobile Optimizations:
- Simplified table layout
- Larger touch targets
- Optimized spacing
- Mobile-friendly navigation

## 🔒 Security Considerations

### Authentication:
- JWT token validation
- Role-based access control
- Secure API endpoints

### Payment Security:
- Secure payment processing
- Payment intent validation
- Error handling for failed payments

### Data Protection:
- Secure data transmission
- Input validation
- XSS protection

## 📋 Component Checklist

### ✅ Implemented Features:
- [x] Fetch rent payment history
- [x] Display payment amount
- [x] Show month and year
- [x] Display payment status
- [x] Red warning for locked rentals
- [x] Tailwind CSS styling
- [x] Red highlighting for overdue payments
- [x] "Pay Now" button for pending/failed payments
- [x] Route configuration
- [x] Navbar link update

### 🔄 Future Enhancements:
- [ ] Multiple payment methods
- [ ] Payment export functionality
- [ ] Real-time payment updates
- [ ] Advanced filtering options
- [ ] Payment analytics
- [ ] Email notifications 