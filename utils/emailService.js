import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email templates
const emailTemplates = {
  rentReminder: (tenantName, propertyTitle, dueDate, amount) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rent Payment Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
        .warning { background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Smart Rental System</h1>
          <p>Rent Payment Reminder</p>
        </div>
        <div class="content">
          <h2>Hello ${tenantName},</h2>
          <p>This is a friendly reminder that your rent payment is due soon.</p>
          
          <div class="warning">
            <strong>⚠️ Payment Due in 3 Days</strong>
          </div>
          
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Property:</strong> ${propertyTitle}</li>
            <li><strong>Due Date:</strong> ${dueDate}</li>
            <li><strong>Amount:</strong> ${amount} PLN</li>
          </ul>
          
          <p>Please ensure your payment is made on time to avoid any late fees or service interruptions.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-rents" class="button">
              Pay Rent Now
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please contact your landlord.</p>
          
          <p>Best regards,<br>Smart Rental System Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Smart Rental System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  paymentSuccess: (landlordName, tenantName, propertyTitle, amount, paymentDate) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rent Payment Received</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .success { background-color: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Smart Rental System</h1>
          <p>Payment Received</p>
        </div>
        <div class="content">
          <h2>Hello ${landlordName},</h2>
          <p>Great news! A rent payment has been successfully processed.</p>
          
          <div class="success">
            <strong>✅ Payment Successfully Received</strong>
          </div>
          
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Tenant:</strong> ${tenantName}</li>
            <li><strong>Property:</strong> ${propertyTitle}</li>
            <li><strong>Amount:</strong> ${amount} PLN</li>
            <li><strong>Payment Date:</strong> ${paymentDate}</li>
          </ul>
          
          <p>The payment has been automatically recorded in your account. You can view the payment details in your landlord dashboard.</p>
          
          <p>Thank you for using Smart Rental System!</p>
          
          <p>Best regards,<br>Smart Rental System Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Smart Rental System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  overdueWarning: (tenantName, propertyTitle, overdueDays, amount) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Urgent: Overdue Rent Payment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .urgent { background-color: #FEE2E2; border: 1px solid #DC2626; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Smart Rental System</h1>
          <p>Urgent: Overdue Payment</p>
        </div>
        <div class="content">
          <h2>Hello ${tenantName},</h2>
          <p>This is an urgent notice regarding your overdue rent payment.</p>
          
          <div class="urgent">
            <strong>🚨 URGENT: Payment Overdue by ${overdueDays} Days</strong>
          </div>
          
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Property:</strong> ${propertyTitle}</li>
            <li><strong>Overdue Amount:</strong> ${amount} PLN</li>
            <li><strong>Days Overdue:</strong> ${overdueDays} days</li>
          </ul>
          
          <p><strong>Important:</strong> If payment is not received within the next 2 days, your rental access will be automatically locked.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-rents" class="button">
              Pay Overdue Rent Now
            </a>
          </div>
          
          <p>Please make your payment immediately to avoid service interruption.</p>
          
          <p>Best regards,<br>Smart Rental System Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Smart Rental System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  rentalLocked: (tenantName, propertyTitle, overdueDays, amount) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rental Access Locked</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .locked { background-color: #FEE2E2; border: 1px solid #DC2626; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Smart Rental System</h1>
          <p>Rental Access Locked</p>
        </div>
        <div class="content">
          <h2>Hello ${tenantName},</h2>
          <p>Your rental property access has been automatically locked due to overdue rent payments.</p>
          
          <div class="locked">
            <strong>🔒 RENTAL ACCESS LOCKED</strong>
          </div>
          
          <h3>Lock Details:</h3>
          <ul>
            <li><strong>Property:</strong> ${propertyTitle}</li>
            <li><strong>Overdue Amount:</strong> ${amount} PLN</li>
            <li><strong>Days Overdue:</strong> ${overdueDays} days</li>
            <li><strong>Lock Status:</strong> Active</li>
          </ul>
          
          <p><strong>Action Required:</strong> Your rental access will remain locked until all overdue payments are cleared.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-rents" class="button">
              Pay Overdue Rent Now
            </a>
          </div>
          
          <p>Once payment is received, your access will be automatically restored within 24 hours.</p>
          
          <p>If you have any questions, please contact your landlord immediately.</p>
          
          <p>Best regards,<br>Smart Rental System Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Smart Rental System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  offerNotification: (tenantName, landlordName, propertyTitle, rentAmount, offerId) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Rental Offer Received</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
        .offer { background-color: #E0F2FE; border: 1px solid #4F46E5; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Smart Rental System</h1>
          <p>New Rental Offer Received</p>
        </div>
        <div class="content">
          <h2>Hello ${tenantName},</h2>
          <p>You have received a new rental offer for the property "${propertyTitle}".</p>
          
          <div class="offer">
            <strong>🎉 New Offer Received!</strong>
          </div>
          
          <h3>Offer Details:</h3>
          <ul>
            <li><strong>Landlord:</strong> ${landlordName}</li>
            <li><strong>Property:</strong> ${propertyTitle}</li>
            <li><strong>Rent Amount:</strong> ${rentAmount} PLN</li>
            <li><strong>Offer ID:</strong> ${offerId}</li>
          </ul>
          
          <p>Please review the offer and take appropriate action. You can view the offer details in your tenant dashboard.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-offers" class="button">
              View Offer Details
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please contact your landlord.</p>
          
          <p>Best regards,<br>Smart Rental System Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Smart Rental System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

// Main email sending function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Email service not configured. Skipping email send.');
      console.log('📧 Email would have been sent to:', to);
      console.log('📧 Subject:', subject);
      return { success: false, reason: 'Email service not configured' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email sending failed:', {
      error: error.message,
      to: to,
      subject: subject
    });
    
    // Don't crash the system, just log the error
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendRentReminder = async (tenantEmail, tenantName, propertyTitle, dueDate, amount) => {
  const subject = '🏠 Rent Payment Reminder - Due in 3 Days';
  const htmlContent = emailTemplates.rentReminder(tenantName, propertyTitle, dueDate, amount);
  return await sendEmail(tenantEmail, subject, htmlContent);
};

const sendPaymentSuccess = async (landlordEmail, landlordName, tenantName, propertyTitle, amount, paymentDate) => {
  const subject = '✅ Rent Payment Received';
  const htmlContent = emailTemplates.paymentSuccess(landlordName, tenantName, propertyTitle, amount, paymentDate);
  return await sendEmail(landlordEmail, subject, htmlContent);
};

const sendOverdueWarning = async (tenantEmail, tenantName, propertyTitle, overdueDays, amount) => {
  const subject = '🚨 URGENT: Overdue Rent Payment';
  const htmlContent = emailTemplates.overdueWarning(tenantName, propertyTitle, overdueDays, amount);
  return await sendEmail(tenantEmail, subject, htmlContent);
};

const sendRentalLocked = async (tenantEmail, tenantName, propertyTitle, overdueDays, amount) => {
  const subject = '🔒 Rental Access Locked - Immediate Action Required';
  const htmlContent = emailTemplates.rentalLocked(tenantName, propertyTitle, overdueDays, amount);
  return await sendEmail(tenantEmail, subject, htmlContent);
};

const sendOfferNotification = async (tenantEmail, tenantName, landlordName, propertyTitle, rentAmount, offerId) => {
  const subject = 'New Rental Offer Received - Action Required';
  const htmlContent = emailTemplates.offerNotification(tenantName, landlordName, propertyTitle, rentAmount, offerId);
  return await sendEmail(tenantEmail, subject, htmlContent);
};

export {
  sendEmail,
  sendRentReminder,
  sendPaymentSuccess,
  sendOverdueWarning,
  sendRentalLocked,
  sendOfferNotification,
  emailTemplates
}; 