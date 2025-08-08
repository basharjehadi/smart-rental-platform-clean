# 🐳 Smart Rental System - Docker Setup Guide

This guide will help you run the Smart Rental System using Docker, which eliminates all environment compatibility issues and provides a consistent development experience.

## 📋 Prerequisites

1. **Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop/
   - Make sure Docker Desktop is started

2. **Git** (for cloning the repository)

## 🚀 Quick Start

### Option 1: Using PowerShell Script (Recommended for Windows)

1. **Open PowerShell** in the project directory
2. **Start the services:**
   ```powershell
   .\docker-setup.ps1 start
   ```
3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Adminer (Database): http://localhost:8080 (optional)

### Option 2: Using Docker Compose Directly

1. **Build and start all services:**
   ```bash
   docker-compose up --build -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## 🛠️ Available Commands

### PowerShell Script Commands

```powershell
# Start all services
.\docker-setup.ps1 start

# Stop all services
.\docker-setup.ps1 stop

# Restart all services
.\docker-setup.ps1 restart

# View logs
.\docker-setup.ps1 logs

# Check service status
.\docker-setup.ps1 status

# Clean up Docker resources
.\docker-setup.ps1 cleanup

# Access backend container shell
.\docker-setup.ps1 backend

# Access frontend container shell
.\docker-setup.ps1 frontend

# Run database commands
.\docker-setup.ps1 db

# Seed database with initial data
.\docker-setup.ps1 seed
```

### Docker Compose Commands

```bash
# Start services in background
docker-compose up -d

# Start services with logs
docker-compose up

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check status
docker-compose ps

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 🏗️ Architecture

The Docker setup includes:

- **Backend**: Node.js 20 with Express, Prisma, and Puppeteer
- **Frontend**: React with Vite
- **Database**: SQLite (for simplicity)
- **Optional Services**: Redis (for caching), Adminer (database management)

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables (configured in `docker-compose.yml`):

```yaml
# Backend Environment
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=your_jwt_secret_here_change_in_production
SESSION_SECRET=your_session_secret_here_change_in_production
FRONTEND_URL=http://localhost:5173
PORT=3001

# Frontend Environment
VITE_API_URL=http://localhost:3001/api
VITE_DEV_SERVER_HOST=0.0.0.0
```

### Ports

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Adminer**: http://localhost:8080 (optional)
- **Redis**: localhost:6379 (optional)

## 🗄️ Database Management

### Using Adminer (Web Interface)

1. Start Adminer:
   ```powershell
   docker-compose --profile tools up -d adminer
   ```

2. Access Adminer at: http://localhost:8080
   - System: SQLite
   - Server: backend
   - Username: (leave empty)
   - Password: (leave empty)
   - Database: /app/dev.db

### Using Command Line

```powershell
# Run database migrations
.\docker-setup.ps1 db

# Seed database with initial data
.\docker-setup.ps1 seed

# Access backend shell for database operations
.\docker-setup.ps1 backend
```

## 🔍 Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   ❌ Docker is not running. Please start Docker Desktop first.
   ```
   **Solution**: Start Docker Desktop

2. **Port already in use**
   ```
   Error: Port 3001 is already in use
   ```
   **Solution**: Stop the service using the port or change the port in `docker-compose.yml`

3. **Build fails**
   ```
   Error: failed to build
   ```
   **Solution**: 
   ```powershell
   .\docker-setup.ps1 cleanup
   .\docker-setup.ps1 start
   ```

4. **Database connection issues**
   ```
   Error: Cannot connect to database
   ```
   **Solution**: 
   ```powershell
   .\docker-setup.ps1 db
   .\docker-setup.ps1 seed
   ```

### Viewing Logs

```powershell
# View all logs
.\docker-setup.ps1 logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Resetting Everything

```powershell
# Stop and remove everything
.\docker-setup.ps1 cleanup

# Start fresh
.\docker-setup.ps1 start
```

## 📁 Project Structure

```
smart-rental-system/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── docker-setup.ps1
├── docker-setup.sh
└── DOCKER_SETUP.md
```

## 🚀 Production Deployment

For production deployment, consider:

1. **Using PostgreSQL** instead of SQLite
2. **Adding Nginx** as a reverse proxy
3. **Using Docker Swarm** or **Kubernetes** for orchestration
4. **Setting up proper SSL certificates**
5. **Configuring environment variables** for production

## 📞 Support

If you encounter any issues:

1. Check the logs: `.\docker-setup.ps1 logs`
2. Verify Docker is running: `docker info`
3. Check service status: `.\docker-setup.ps1 status`
4. Try a clean restart: `.\docker-setup.ps1 cleanup && .\docker-setup.ps1 start`

## 🎉 Success!

Once everything is running, you should see:

- ✅ Backend API running on http://localhost:3001
- ✅ Frontend application running on http://localhost:5173
- ✅ Database initialized and seeded
- ✅ All services healthy

You can now access the Smart Rental System and start using all its features!
