# 🕐 Cron Job System Documentation

## Overview
The Smart Rental System includes a comprehensive cron job system for automated rent management. This system runs daily to check rent payments and manage rental request statuses.

## 🔧 Components

### 1. Database Schema Updates

#### New Fields in `Offer` Model:
- `leaseStartDate`: When the lease actually starts
- `leaseEndDate`: When the lease ends

#### New `RentPayment` Model:
- `id`: Unique identifier
- `amount`: Rent amount
- `status`: Payment status (PENDING, SUCCEEDED, FAILED)
- `dueDate`: When rent is due
- `paidDate`: When rent was paid
- `month`: Month number (1-12)
- `year`: Year (e.g., 2024)
- `offerId`: Reference to the offer
- `tenantId`: Reference to the tenant

#### Updated `RequestStatus` Enum:
- Added `LOCKED` status for overdue payments

### 2. Cron Job Controller (`controllers/cronController.js`)

#### Main Functions:

##### `dailyRentCheck()`
- **Schedule**: Runs daily at 9:00 AM (Europe/Warsaw timezone)
- **Purpose**: Main cron job function that processes all active offers

##### `processRentPayment(offer, currentMonth, currentYear, today)`
- Checks if rent payment already exists for the current month
- Creates new rent payment entries if needed
- Checks for overdue payments (>5 days) and locks rental requests

##### `lockRentalRequest(rentalRequestId)`
- Updates rental request status to `LOCKED`
- Sets `isLocked` flag to `true`

##### `initializeLeaseDates(offerId)`
- Called when an offer is accepted
- Sets lease start date to `availableFrom` date
- Calculates lease end date based on lease duration

##### `getRentPaymentStatus(offerId)`
- Returns all rent payments for an offer
- Ordered by year and month (descending)

##### `markRentPaymentAsPaid(rentPaymentId)`
- Updates rent payment status to `SUCCEEDED`
- Sets `paidDate` to current timestamp

### 3. Server Integration (`server.js`)

#### Cron Job Initialization:
```javascript
// Daily rent check - runs at 9:00 AM every day
cron.schedule('0 9 * * *', async () => {
  console.log('🕐 Running daily rent check cron job...');
  await dailyRentCheck();
}, {
  scheduled: true,
  timezone: "Europe/Warsaw"
});
```

### 4. Admin Endpoints (`routes/adminRoutes.js`)

#### Manual Trigger:
- `POST /api/admin/trigger-daily-check`
- Requires authentication
- Manually triggers the daily rent check

## 🔄 How It Works

### Daily Process:

1. **Find Active Offers**
   - Queries all offers with status `ACCEPTED`
   - Checks that lease has started (`leaseStartDate <= today`)
   - Checks that lease hasn't ended (`leaseEndDate >= today`)

2. **Process Each Offer**
   - For each active offer, check if rent payment exists for current month
   - If no payment exists, create new `RentPayment` entry with status `PENDING`
   - If payment exists and is `PENDING`, check if overdue (>5 days)

3. **Handle Overdue Payments**
   - If rent is overdue by more than 5 days, lock the rental request
   - Sets rental request status to `LOCKED`
   - Sets `isLocked` flag to `true`

### Lease Date Initialization:

When a tenant accepts an offer:
1. `updateOfferStatus()` is called
2. If status is `ACCEPTED`, `initializeLeaseDates()` is called
3. Lease start date is set to `availableFrom` date
4. Lease end date is calculated: `availableFrom + leaseDuration` months

## 🧪 Testing

### Manual Testing:
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Trigger daily rent check
curl -X POST http://localhost:3000/api/admin/trigger-daily-check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Scenarios:

1. **New Month Rent Creation**
   - Accept an offer with lease dates in the past
   - Trigger daily rent check
   - Verify new rent payment is created

2. **Overdue Payment Locking**
   - Create a rent payment with status `PENDING`
   - Set due date to more than 5 days ago
   - Trigger daily rent check
   - Verify rental request is locked

3. **Lease Date Initialization**
   - Accept an offer
   - Verify lease dates are set correctly

## 📊 Database Queries

### Find Active Offers:
```sql
SELECT * FROM offers 
WHERE status = 'ACCEPTED' 
  AND leaseStartDate <= CURRENT_DATE 
  AND leaseEndDate >= CURRENT_DATE
```

### Find Overdue Payments:
```sql
SELECT * FROM rent_payments 
WHERE status = 'PENDING' 
  AND dueDate < DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY)
```

### Lock Rental Request:
```sql
UPDATE rental_requests 
SET status = 'LOCKED', isLocked = true 
WHERE id = ?
```

## 🔧 Configuration

### Environment Variables:
- `JWT_SECRET`: Required for authentication
- `PORT`: Server port (default: 3000)

### Cron Schedule:
- **Pattern**: `0 9 * * *` (9:00 AM daily)
- **Timezone**: Europe/Warsaw
- **Customizable**: Change in `server.js`

### Overdue Threshold:
- **Default**: 5 days
- **Location**: `controllers/cronController.js` in `processRentPayment()`
- **Customizable**: Modify the condition `daysOverdue > 5`

## 🚀 Deployment Considerations

### Production Setup:
1. Ensure server timezone is set correctly
2. Monitor cron job logs
3. Set up alerts for failed cron jobs
4. Consider using a process manager (PM2)

### Monitoring:
- Check server logs for cron job execution
- Monitor database for new rent payments
- Track locked rental requests

### Backup:
- Regular database backups
- Cron job configuration backup
- Log rotation for cron job logs

## 🔍 Troubleshooting

### Common Issues:

1. **Cron Job Not Running**
   - Check server timezone
   - Verify cron schedule pattern
   - Check server logs

2. **Database Permission Errors**
   - Ensure Prisma client is generated
   - Check database connection
   - Verify schema migrations

3. **Lease Dates Not Set**
   - Check if offer acceptance triggers lease initialization
   - Verify `initializeLeaseDates()` function
   - Check database constraints

### Debug Commands:
```bash
# Check cron job status
curl -X POST http://localhost:3000/api/admin/trigger-daily-check \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check database schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## 📈 Future Enhancements

### Potential Improvements:
1. **Email Notifications**: Send reminders for overdue payments
2. **Payment Integration**: Connect with Stripe for automatic rent collection
3. **Reporting**: Generate monthly rent reports
4. **Flexible Schedules**: Allow different rent due dates
5. **Late Fees**: Automatic late fee calculation
6. **Payment Plans**: Support for partial payments

### API Endpoints to Add:
- `GET /api/rent-payments/:offerId` - Get rent payment history
- `POST /api/rent-payments/:id/pay` - Mark rent as paid
- `GET /api/rental-requests/locked` - Get locked rental requests
- `POST /api/rental-requests/:id/unlock` - Unlock rental request (admin) 