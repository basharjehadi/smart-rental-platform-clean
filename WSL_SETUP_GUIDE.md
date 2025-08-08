# 🐧 WSL Setup Guide for Smart Rental System

## 📋 Prerequisites

### 1. Install Node.js in WSL
```bash
# Update package list
sudo apt update

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install Required System Dependencies
```bash
# Install build tools and dependencies
sudo apt-get install -y build-essential python3

# Install Ghostscript for PDF compression
sudo apt-get install -y ghostscript

# Install additional dependencies for native modules
sudo apt-get install -y libc6-dev
```

## 🔧 Project Setup in WSL

### 1. Navigate to Project Directory
```bash
# You're already in the project directory
pwd
# Should show: /mnt/c/Users/Md Abul Bashar Jehad/Desktop/Smart rental System
```

### 2. Clean and Reinstall Dependencies
```bash
# Remove existing node_modules and package-lock files
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Prisma for WSL
```bash
# Go back to backend directory
cd ../backend

# Generate Prisma client for Linux
npx prisma generate

# Push database schema
npx prisma db push
```

### 4. Environment Setup
```bash
# Copy environment files if they don't exist
cp .env.example .env 2>/dev/null || echo ".env already exists"

# Edit environment file if needed
nano .env
```

## 🚀 Running the Project in WSL

### Option 1: Run Both Backend and Frontend
```bash
# From project root
npm run dev
```

### Option 2: Run Separately

#### Backend Only:
```bash
cd backend
npm run dev
```

#### Frontend Only:
```bash
cd frontend
npm run dev
```

### Option 3: Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start production servers
cd ..
npm start
```

## 🔍 Troubleshooting Common WSL Issues

### 1. Native Module Errors
If you get errors like "invalid ELF header" or "Cannot find module":
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 2. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### 3. Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :5173

# Kill processes if needed
sudo kill -9 <PID>
```

### 4. Database Issues
```bash
# Reset database if needed
cd backend
npx prisma db push --force-reset
npx prisma db seed
```

## 🌐 Accessing the Application

### From WSL:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### From Windows Browser:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## 📝 Useful WSL Commands

```bash
# Exit WSL
exit

# Restart WSL
wsl --shutdown
wsl -d Ubuntu

# Check WSL status
wsl --list --verbose

# Update WSL
sudo apt update && sudo apt upgrade
```

## 🎯 Quick Start Script

Create a quick start script:
```bash
# Create start script
cat > start-wsl.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Smart Rental System in WSL..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Generate Prisma client
echo "🔧 Setting up database..."
cd backend && npx prisma generate && cd ..

# Start the application
echo "🎉 Starting application..."
npm run dev
EOF

# Make it executable
chmod +x start-wsl.sh

# Run it
./start-wsl.sh
```

## ✅ Verification Checklist

- [ ] Node.js installed and working
- [ ] All dependencies installed
- [ ] Prisma client generated
- [ ] Database connected
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can access admin dashboard
- [ ] Contracts loading without duplicates

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Ensure all dependencies are properly installed
3. Verify WSL is running the latest version
4. Check that ports are not being used by Windows processes

