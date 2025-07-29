# 📧 Email Notification System Documentation

## Overview
The Email Notification System provides automated email notifications for rent payments, reminders, and alerts using NodeMailer. It integrates seamlessly with the daily cron job and payment processing to keep tenants and landlords informed about their rental status.

## 🎯 Features

### Core Functionality:
- **Rent Reminders**: 3 days before rent is due
- **Payment Success Notifications**: Notify landlords when payments are received
- **Overdue Warnings**: Alert tenants about overdue payments
- **Lock Notifications**: Inform tenants when rental access is locked
- **HTML Email Templates**: Professional, responsive email designs
- **Fallback Logging**: Graceful handling when email service is not configured

### Email Types:
1. **Rent Reminder**: Sent 3 days before rent is due
2. **Payment Success**: Sent to landlord when payment is received
3. **Overdue Warning**: Sent to tenant when payment is 5+ days overdue
4. **Rental Locked**: Sent to tenant when rental access is locked

## 🔧 Technical Implementation

### Dependencies:
- **NodeMailer**: Email sending library
- **Environment Variables**: Email service configuration
- **HTML Templates**: Responsive email designs

### Email Service Configuration:
```javascript
// Environment variables required
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
FRONTEND_URL=http://localhost:5173
```

## 📧 Email Templates

### 1. Rent Reminder Template
- **Purpose**: Remind tenants 3 days before rent is due
- **Features**: 
  - Professional design with Smart Rental branding
  - Clear payment details (property, due date, amount)
  - Direct link to payment page
  - Responsive design for mobile devices

### 2. Payment Success Template
- **Purpose**: Notify landlords when payments are received
- **Features**:
  - Success indicators and green color scheme
  - Payment details (tenant, property, amount, date)
  - Professional landlord notification format

### 3. Overdue Warning Template
- **Purpose**: Alert tenants about overdue payments
- **Features**:
  - Urgent red color scheme
  - Days overdue information
  - Warning about potential lock
  - Direct payment link

### 4. Rental Locked Template
- **Purpose**: Inform tenants when rental access is locked
- **Features**:
  - Lock status indicators
  - Clear action required message
  - Payment instructions
  - Contact landlord information

## 🔄 Integration Points

### 1. Daily Cron Job Integration
```javascript
// In cronController.js
import { 
  sendRentReminder, 
  sendPaymentSuccess, 
  sendOverdueWarning, 
  sendRentalLocked 
} from '../utils/emailService.js';

// Send reminder 3 days before due date
if (daysUntilDue <= 3 && daysUntilDue > 0) {
  await sendRentReminder(
    tenant.email,
    tenant.name,
    rentalRequest.title,
    dueDate.toLocaleDateString(),
    offer.rentAmount
  );
}

// Send overdue warning after 5 days
if (daysOverdue >= 5 && daysOverdue <= 7) {
  await sendOverdueWarning(
    tenant.email,
    tenant.name,
    rentalRequest.title,
    daysOverdue,
    existingPayment.amount
  );
}

// Send locked notification
if (daysOverdue === 5) {
  await sendRentalLocked(
    tenant.email,
    tenant.name,
    rentalRequest.title,
    daysOverdue,
    existingPayment.amount
  );
}
```

### 2. Payment Success Integration
```javascript
// In paymentController.js
import { sendPaymentSuccess } from '../utils/emailService.js';

// Send payment success notification to landlord
if (payment.offer.landlord?.email) {
  await sendPaymentSuccess(
    payment.offer.landlord.email,
    payment.offer.landlord.name,
    payment.offer.rentalRequest.tenant.name,
    payment.offer.rentalRequest.title,
    payment.amount,
    new Date().toLocaleDateString()
  );
}
```

## 🛠️ Email Service Functions

### Main Functions:

#### `sendEmail(to, subject, htmlContent)`
- **Purpose**: Core email sending function
- **Parameters**:
  - `to`: Recipient email address
  - `subject`: Email subject line
  - `htmlContent`: HTML email content
- **Returns**: `{ success: boolean, messageId?: string, error?: string }`

#### `sendRentReminder(tenantEmail, tenantName, propertyTitle, dueDate, amount)`
- **Purpose**: Send rent reminder to tenant
- **Template**: Professional reminder with payment details
- **Timing**: 3 days before due date

#### `sendPaymentSuccess(landlordEmail, landlordName, tenantName, propertyTitle, amount, paymentDate)`
- **Purpose**: Notify landlord of successful payment
- **Template**: Success notification with payment details
- **Timing**: Immediately after payment success

#### `sendOverdueWarning(tenantEmail, tenantName, propertyTitle, overdueDays, amount)`
- **Purpose**: Warn tenant about overdue payment
- **Template**: Urgent warning with lock threat
- **Timing**: 5+ days overdue

#### `sendRentalLocked(tenantEmail, tenantName, propertyTitle, overdueDays, amount)`
- **Purpose**: Inform tenant that rental is locked
- **Template**: Lock notification with payment instructions
- **Timing**: When rental is locked (5+ days overdue)

## 🎨 Email Template Design

### Design Features:
- **Responsive Design**: Works on desktop and mobile
- **Professional Branding**: Smart Rental System branding
- **Color Coding**: 
  - Green for success messages
  - Red for warnings and urgent messages
  - Blue for general information
- **Clear Call-to-Action**: Prominent payment buttons
- **Accessibility**: High contrast and readable fonts

### Template Structure:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Subject</title>
  <style>
    /* Responsive CSS styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Branding and title -->
    </div>
    <div class="content">
      <!-- Main email content -->
    </div>
    <div class="footer">
      <!-- Footer information -->
    </div>
  </div>
</body>
</html>
```

## 🔧 Configuration

### Environment Variables:
```bash
# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
FRONTEND_URL=http://localhost:5173
```

### Gmail Setup:
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in EMAIL_PASSWORD
4. Set EMAIL_USER to your Gmail address

### Other Email Services:
- **Outlook**: Use `EMAIL_SERVICE=outlook`
- **Yahoo**: Use `EMAIL_SERVICE=yahoo`
- **Custom SMTP**: Configure manually in transporter

## 🚀 Usage Examples

### Basic Email Sending:
```javascript
import { sendEmail } from '../utils/emailService.js';

const result = await sendEmail(
  'user@example.com',
  'Test Subject',
  '<h1>Hello</h1><p>This is a test email.</p>'
);

console.log(result); // { success: true, messageId: '...' }
```

### Rent Reminder:
```javascript
import { sendRentReminder } from '../utils/emailService.js';

await sendRentReminder(
  'tenant@example.com',
  'John Doe',
  'Beautiful 2-bedroom apartment',
  '2024-02-05',
  1200
);
```

### Payment Success Notification:
```javascript
import { sendPaymentSuccess } from '../utils/emailService.js';

await sendPaymentSuccess(
  'landlord@example.com',
  'Jane Smith',
  'John Doe',
  'Beautiful 2-bedroom apartment',
  1200,
  '2024-02-01'
);
```

## 🐛 Error Handling

### Graceful Degradation:
- **No Email Service**: Logs message and continues without crashing
- **Invalid Credentials**: Logs error and continues
- **Network Issues**: Logs error and continues
- **Template Errors**: Logs error and continues

### Error Logging:
```javascript
// Email service not configured
console.log('📧 Email service not configured. Skipping email send.');
console.log('📧 Email would have been sent to:', to);
console.log('📧 Subject:', subject);

// Email sending failed
console.error('📧 Email sending failed:', {
  error: error.message,
  to: to,
  subject: subject
});
```

### Fallback Behavior:
- System continues to function normally
- No crashes or interruptions
- All email attempts are logged
- Users can still access all features

## 📊 Monitoring and Logging

### Email Logging:
```javascript
// Successful email
console.log('📧 Email sent successfully:', {
  messageId: info.messageId,
  to: to,
  subject: subject
});

// Failed email
console.error('📧 Email sending failed:', {
  error: error.message,
  to: to,
  subject: subject
});
```

### Metrics to Track:
- Number of emails sent successfully
- Number of failed email attempts
- Email delivery rates
- User engagement with email content

## 🔒 Security Considerations

### Email Security:
- **App Passwords**: Use app passwords instead of regular passwords
- **Environment Variables**: Store credentials securely
- **No Hardcoding**: Never hardcode email credentials
- **Validation**: Validate email addresses before sending

### Data Protection:
- **Personal Information**: Handle tenant/landlord data carefully
- **Payment Information**: Never include payment details in emails
- **GDPR Compliance**: Ensure email consent and data handling

## 📈 Future Enhancements

### Potential Improvements:
1. **Email Templates**: More template variations
2. **Scheduling**: Advanced email scheduling
3. **Analytics**: Email open/click tracking
4. **Personalization**: Dynamic content based on user data
5. **A/B Testing**: Test different email formats
6. **Unsubscribe**: Email unsubscribe functionality

### Advanced Features:
- **Email Queuing**: Queue emails for better performance
- **Retry Logic**: Automatic retry for failed emails
- **Template Engine**: Dynamic template generation
- **Email Preferences**: User email preference settings

## 🧪 Testing

### Test Scenarios:
1. **Email Service Not Configured**: Should log and continue
2. **Invalid Credentials**: Should log error and continue
3. **Network Issues**: Should handle gracefully
4. **Template Rendering**: Should work with all templates
5. **Email Delivery**: Should send emails successfully

### Test Commands:
```javascript
// Test email service
node test-email.js

// Test with different scenarios
// - No email service configured
// - Valid email service
// - Invalid credentials
// - Network issues
```

## 📋 Configuration Checklist

### ✅ Required Setup:
- [ ] Install NodeMailer: `npm install nodemailer`
- [ ] Set EMAIL_SERVICE environment variable
- [ ] Set EMAIL_USER environment variable
- [ ] Set EMAIL_PASSWORD environment variable
- [ ] Set FRONTEND_URL environment variable
- [ ] Test email service functionality
- [ ] Verify email templates render correctly
- [ ] Test error handling scenarios

### 🔧 Gmail Setup:
- [ ] Enable 2-factor authentication
- [ ] Generate app password
- [ ] Use app password in configuration
- [ ] Test with Gmail SMTP

### 📧 Email Templates:
- [ ] Rent reminder template
- [ ] Payment success template
- [ ] Overdue warning template
- [ ] Rental locked template
- [ ] Responsive design
- [ ] Professional branding

## 🎯 Best Practices

### Email Design:
- Use responsive design
- Include clear call-to-action buttons
- Use appropriate color coding
- Keep content concise and clear
- Include unsubscribe options

### Error Handling:
- Never crash the system
- Log all email attempts
- Provide fallback behavior
- Handle network issues gracefully

### Security:
- Use environment variables
- Validate email addresses
- Protect sensitive information
- Follow email security best practices

### Performance:
- Use async/await properly
- Handle email sending asynchronously
- Don't block other operations
- Log performance metrics 