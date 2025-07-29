# 🔒 Smart Lock Simulation Documentation

## Overview
The Smart Lock Simulation is a feature integrated into the Tenant Dashboard that provides tenants with real-time information about their rental property's lock status. It simulates a smart lock system that can be locked or unlocked based on rent payment status, providing visual feedback and actionable information to tenants.

## 🎯 Features

### Core Functionality:
- **Real-time Lock Status**: Shows current lock status (LOCKED/UNLOCKED)
- **Visual Indicators**: Lock/unlock icons and color-coded status
- **Payment Integration**: Links lock status to rent payment status
- **Actionable Alerts**: Clear warnings and payment buttons for locked rentals
- **Property Information**: Displays rental details and landlord information

### Visual Elements:
- **Lock Icons**: 🔒 for locked, 🔓 for unlocked
- **Status Badges**: Color-coded status indicators
- **Warning Banners**: Red banners for locked rentals
- **Success Messages**: Green banners for unlocked rentals
- **Payment Buttons**: Direct links to rent payment page

## 🔧 Backend Integration

### API Endpoint:
- **Route**: `GET /api/current-rental-status`
- **Authentication**: Required (JWT token)
- **Role**: Tenant only
- **Response**: Current rental status with lock information

### Response Structure:
```json
{
  "hasRental": boolean,
  "message": "string" (if no rental),
  "rental": {
    "id": "string",
    "title": "string",
    "location": "string",
    "status": "ACTIVE|LOCKED",
    "isLocked": boolean,
    "offer": {
      "id": "string",
      "rentAmount": number,
      "leaseStartDate": "date|null",
      "leaseEndDate": "date|null",
      "landlord": {
        "id": "string",
        "name": "string",
        "email": "string"
      }
    }
  }
}
```

## 🎨 Component Structure

### Smart Lock Section:
1. **Header**: "Smart Lock Status" title
2. **Loading State**: Spinner while fetching status
3. **Error State**: Error message display
4. **Lock Status Display**: Main lock status card
5. **Warning/Success Messages**: Contextual information
6. **Action Buttons**: Payment links for locked rentals

### Key Functions:

#### `fetchRentalStatus()`
- Fetches current rental status from backend
- Handles loading states and errors
- Updates component state

#### `formatDate(dateString)`
- Formats dates for display
- Uses locale-specific formatting

#### `formatCurrency(amount)`
- Formats currency in PLN
- Uses Polish locale formatting

## 🎯 User Experience

### Visual Hierarchy:
1. **Status Level**: Lock/unlock status at the top
2. **Property Level**: Rental property information
3. **Action Level**: Payment buttons and warnings
4. **Information Level**: Landlord and payment details

### Color Coding:
- **Red**: Locked rentals, warnings, and alerts
- **Green**: Unlocked rentals and success messages
- **Gray**: Loading states and neutral information
- **Blue**: Action buttons and links

### Status Icons:
- 🔒 Locked (red background)
- 🔓 Unlocked (green background)
- ⚠️ Warning (red alerts)
- ✅ Success (green messages)

### Responsive Design:
- Mobile-friendly layout
- Responsive card system
- Flexible status display

## 🔄 State Management

### Component State:
```javascript
const [rentalStatus, setRentalStatus] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

### State Updates:
- **Loading**: During API calls
- **Error**: When API calls fail
- **Data**: When rental status is successfully fetched

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
- Optimized status checks

## 📊 Data Processing

### Backend Processing:
1. **Fetch Rental**: Get tenant's most recent active rental
2. **Check Status**: Determine if rental is locked or active
3. **Include Offer**: Get associated offer and landlord information
4. **Return Status**: Provide comprehensive rental status

### Frontend Processing:
1. **Display Status**: Show lock/unlock status
2. **Show Property**: Display rental property information
3. **Handle Actions**: Show appropriate buttons and warnings
4. **Format Data**: Format dates, currency, and text

## 🧪 Testing Scenarios

### Test Cases:

1. **No Active Rental**
   - No rental found
   - Shows appropriate message
   - Provides link to create rental request

2. **Unlocked Rental**
   - Active rental with no overdue payments
   - Shows green unlock status
   - Displays success message

3. **Locked Rental**
   - Rental with overdue payments
   - Shows red lock status
   - Displays warning message
   - Shows payment button

4. **Loading State**
   - While fetching data
   - Shows loading spinner
   - Displays loading message

### Error Handling:
- Network errors
- Authentication failures
- Invalid data responses

## 🚀 Usage

### Integration:
- Automatically loads when tenant visits dashboard
- Only shows for tenants (role-based display)
- Updates in real-time when rental status changes

### User Flow:
1. Tenant visits dashboard
2. Smart Lock section loads automatically
3. Shows current lock status
4. Provides appropriate actions based on status

### Access Control:
- Protected route (requires authentication)
- Tenant role only
- Automatic data fetching

## 📊 Data Flow

### 1. Component Mount
- `useEffect` triggers `fetchRentalStatus()`
- Sets loading state to true

### 2. API Call
- Makes authenticated request to `/api/current-rental-status`
- Handles response or error

### 3. State Update
- Updates `rentalStatus` with response
- Sets loading to false
- Clears any previous errors

### 4. Rendering
- Shows appropriate lock status
- Displays property information
- Shows warnings or success messages

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
- Additional lock actions can be added
- Real-time updates could be implemented
- Integration with actual smart locks

## 🐛 Troubleshooting

### Common Issues:

1. **No Status Displayed**
   - Check if tenant has active rental
   - Verify API endpoint response
   - Check authentication status

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check user role is TENANT
   - Ensure proper authentication flow

3. **Status Not Updating**
   - Check rental status in database
   - Verify payment status
   - Test with different rental scenarios

### Debug Commands:
```javascript
// Check API response
console.log('Rental status response:', response.data);

// Check component state
console.log('Rental status:', rentalStatus);

// Check authentication
console.log('User:', user);
```

## 📈 Future Enhancements

### Potential Improvements:
1. **Real-time Updates**: WebSocket integration for live status
2. **Smart Lock Integration**: Connect to actual smart lock devices
3. **Push Notifications**: Alert tenants of lock status changes
4. **Geofencing**: Automatic unlock when tenant approaches
5. **Temporary Access**: Generate temporary access codes
6. **Lock History**: Track lock/unlock events

### API Enhancements:
- Real-time status updates
- Lock/unlock commands
- Access code generation
- Lock event logging

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
- Optimized status checks
- Minimal API calls

### Accessibility:
- Semantic HTML structure
- ARIA labels for status indicators
- Keyboard navigation support

## 📊 Business Logic

### Lock Status Logic:
- **LOCKED**: Rental has overdue payments (isLocked: true)
- **UNLOCKED**: Rental has no overdue payments (isLocked: false)
- **NO RENTAL**: Tenant has no active rental property

### Status Calculation:
- Based on rent payment status
- Considers overdue payments
- Updates automatically with payment changes

### Payment Integration:
- Links to rent payment page
- Shows payment status
- Provides payment reminders

## 🔍 Monitoring

### Key Metrics:
- Number of locked rentals
- Lock status change frequency
- Payment completion rates
- User engagement with lock status

### Alerts:
- Lock status changes
- Overdue payment notifications
- Payment completion alerts

### Reports:
- Lock status summaries
- Payment correlation reports
- User behavior analytics

## 🎨 UI/UX Design

### Card Design:
- Clean, organized layout
- Clear status indicators
- Proper spacing and alignment

### Status Indicators:
- Color-coded status badges
- Icons for visual clarity
- Clear status text

### Action Buttons:
- Prominent payment buttons
- Clear call-to-action
- Accessible design

### Warning Banners:
- Red background for locked rentals
- Clear warning messages
- Actionable information

## 📱 Mobile Responsiveness

### Responsive Features:
- Mobile-friendly card layout
- Touch-friendly buttons
- Readable text sizes
- Optimized spacing

### Mobile Optimizations:
- Simplified layout on small screens
- Larger touch targets
- Optimized status display
- Mobile-friendly navigation

## 🔒 Security Considerations

### Authentication:
- JWT token validation
- Role-based access control
- Secure API endpoints

### Data Protection:
- Secure data transmission
- Input validation
- XSS protection

### Access Control:
- Tenant-only access
- Proper authorization checks
- Secure status updates

## 📋 Component Checklist

### ✅ Implemented Features:
- [x] Fetch logged-in tenant's current rental request
- [x] Show red banner for LOCKED status
- [x] Display lock icon (🔒) for locked rentals
- [x] Show green badge for UNLOCKED status
- [x] Display unlock icon (🔓) for unlocked rentals
- [x] Tailwind CSS styling
- [x] Visual feedback for different states
- [x] Payment integration for locked rentals
- [x] Responsive design
- [x] Error handling

### 🔄 Future Enhancements:
- [ ] Real-time status updates
- [ ] Actual smart lock integration
- [ ] Push notifications
- [ ] Geofencing capabilities
- [ ] Temporary access codes
- [ ] Lock history tracking 