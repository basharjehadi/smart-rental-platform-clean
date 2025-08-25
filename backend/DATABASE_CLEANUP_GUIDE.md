# 🗄️ Database Cleanup Guide

## Overview

This guide explains how to safely clean your database while preserving user accounts and KYC information. The cleanup script removes all rental-related data but keeps essential user data intact.

## ⚠️ **IMPORTANT WARNINGS**

- **This will permanently delete all rental data!**
- **Make sure to backup your database before running this script**
- **This action cannot be undone**
- **Only run this in development/testing environments**

## 📋 What Gets Preserved

✅ **User Accounts & Authentication**
- User login credentials
- Email addresses and phone numbers
- User roles (TENANT, LANDLORD, ADMIN)
- Profile information

✅ **KYC Information**
- Identity verification status
- Document uploads
- Verification dates and notes
- Rejection reasons (if any)

✅ **User Settings**
- Profile preferences
- Landlord profile settings
- Availability settings
- GDPR consent

## 🗑️ What Gets Removed

❌ **All Rental Data**
- Properties and listings
- Offers and rental requests
- Payments and contracts
- Conversations and messages
- Reviews and ratings
- Support tickets
- Maintenance requests
- Chat sessions

## 🚀 How to Run the Cleanup Script

### **Method 1: Using npm script (Recommended)**

```bash
# Navigate to backend directory
cd backend

# Run the cleanup script
npm run db:cleanup
```

### **Method 2: Direct execution**

```bash
# Navigate to backend directory
cd backend

# Run the script directly
node cleanup-database.cjs
```

### **Method 3: From project root**

```bash
# From the main project directory
cd backend && npm run db:cleanup
```

## 📊 What the Script Does

1. **Shows current data counts** for all tables
2. **Deletes data in safe order** (child tables first)
3. **Resets user counters** to default values
4. **Shows final data counts** for verification
5. **Provides detailed summary** of what was preserved/removed

## 🔒 Safety Features

- **Foreign key constraint handling** - Deletes in correct order
- **Error handling** - Continues even if some tables fail
- **Progress reporting** - Shows what's happening at each step
- **Rollback protection** - Uses raw SQL for better control

## 📝 Example Output

```
🧹 Starting Database Cleanup...

⚠️  WARNING: This will permanently delete all rental data!
✅ User accounts and KYC information will be preserved.

📊 Current Database Status:
   conversations: 15 records
   properties: 8 records
   offers: 23 records
   payments: 12 records
   ...

🗑️  Starting cleanup process...

🧹 Cleaning messages...
   ✅ messages: 156 records deleted
🧹 Cleaning conversations...
   ✅ conversations: 15 records deleted
🧹 Cleaning properties...
   ✅ properties: 8 records deleted
...

🔄 Resetting user counters and status...
   ✅ User counters reset
   ✅ Landlord profile counters reset

📊 Final Database Status:
   conversations: 0 records
   properties: 0 records
   offers: 0 records
   ...

🎉 Database cleanup completed successfully!

✅ Preserved:
   - User accounts and authentication
   - KYC information and verification status
   - User profile data
   - Landlord profile preferences

🗑️  Removed:
   - All rental properties
   - All offers and rental requests
   - All payments and contracts
   - All conversations and messages
   - All reviews and notifications
   - All support tickets
   - All maintenance requests
```

## 🛡️ Before Running Cleanup

### **1. Backup Your Database**

```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Prisma Studio to export data
npm run db:studio
```

### **2. Verify Environment**

```bash
# Make sure you're in the right environment
echo $NODE_ENV
# Should be 'development' or 'test'

# Check database connection
npm run db:studio
```

### **3. Stop Applications**

```bash
# Stop your backend server
# Stop your frontend
# Stop any other services using the database
```

## 🔄 After Cleanup

### **1. Verify Cleanup**

```bash
# Check that user data is preserved
npm run db:studio

# Look for:
# - Users table still has records
# - KYC information is intact
# - All rental tables are empty
```

### **2. Restart Services**

```bash
# Start your backend
npm run dev

# Start your frontend
cd ../frontend && npm run dev
```

### **3. Test Basic Functionality**

- User login should still work
- User profiles should be accessible
- KYC status should be preserved
- No rental data should appear

## 🚨 Troubleshooting

### **Common Issues**

1. **Permission Denied**
   ```bash
   # Make sure you have database access
   # Check your .env file for correct DATABASE_URL
   ```

2. **Foreign Key Constraints**
   ```bash
   # The script handles this automatically
   # If it fails, check the error message
   ```

3. **Connection Issues**
   ```bash
   # Verify database is running
   # Check network connectivity
   # Verify credentials in .env
   ```

### **Recovery Options**

1. **Restore from backup** (if you made one)
2. **Run database migrations** to recreate tables
3. **Contact support** if data loss is critical

## 📚 Related Commands

```bash
# Other useful database commands
npm run db:studio          # Open Prisma Studio
npm run db:migrate         # Run migrations
npm run db:reset           # Reset entire database (WARNING: deletes everything!)
npm run db:seed            # Seed with test data
```

## 🎯 When to Use This Script

✅ **Development Testing**
- Clean slate for testing new features
- Remove test data between development cycles
- Reset to known state

✅ **Staging Environment**
- Prepare clean environment for testing
- Remove demo data before production deployment

❌ **Production Environment**
- **NEVER run this on production!**
- Use proper backup/restore procedures instead

## 📞 Support

If you encounter issues or need help:

1. **Check the error messages** carefully
2. **Verify your database connection**
3. **Ensure you have proper permissions**
4. **Check the logs** for detailed information

---

**Remember: Always backup before cleanup!** 🛡️
