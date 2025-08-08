#!/bin/bash

echo "🐧 Setting up Smart Rental System for WSL..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Stop any running processes
echo "🛑 Stopping any running processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Clean all node_modules
echo "🧹 Cleaning existing node_modules..."
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Rebuild all native modules for Linux
echo "🔧 Rebuilding native modules for Linux..."
npm rebuild
cd backend && npm rebuild && cd ..
cd frontend && npm rebuild && cd ..

# Generate Prisma client
echo "🔧 Setting up database..."
cd backend
npx prisma generate
cd ..

echo "✅ Setup completed! Now you can run:"
echo "   npm run dev    # Run both backend and frontend"
echo "   cd backend && npm run dev    # Run backend only"
echo "   cd frontend && npm run dev   # Run frontend only"

