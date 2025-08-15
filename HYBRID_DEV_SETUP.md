# Hybrid Development Setup

This document explains the hybrid development approach for the Smart Rental System, where you run your application code locally for fast development while using Docker for infrastructure services.

## Why This Approach?

- **Speed**: Local Node.js + hot reload is faster than rebuilding Docker images on every change
- **Simplicity**: Fewer moving parts while iterating on UI/logic
- **Parity**: Databases/queues run in Docker so versions/config match production
- **Flexibility**: Easy to switch between local and containerized development

## Quick Start

### 1. Prerequisites

- Node.js 18+ (recommend using `nvm`)
- Docker Desktop
- Git

### 2. Initial Setup

```bash
# Clone and setup
git clone <your-repo>
cd smart-rental-system

# Install dependencies
npm run install:all

# Copy development environment
cp env.development .env

# Start infrastructure services
npm run dev:infra

# Start development servers
npm run dev
```

### 3. Development Workflow

```bash
# Start only infrastructure (PostgreSQL, Redis, MinIO)
npm run dev:infra

# Start backend development server
npm run dev:backend

# Start frontend development server  
npm run dev:frontend

# Or start both together
npm run dev

# Or start everything at once
npm run dev:setup
```

## Available Scripts

### Infrastructure Management
- `npm run dev:infra` - Start infrastructure services (PostgreSQL, Redis, MinIO)
- `npm run dev:infra:down` - Stop infrastructure services
- `npm run dev:infra:logs` - View infrastructure logs

### Development Servers
- `npm run dev:backend` - Start backend with hot reload
- `npm run dev:frontend` - Start frontend with hot reload
- `npm run dev` - Start both backend and frontend
- `npm run dev:setup` - Start infrastructure + both dev servers

### Database Management
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database
- `npm run db:seed` - Seed database with test data

### Docker Operations
- `npm run docker:build` - Build and start full Docker setup
- `npm run docker:down` - Stop all Docker containers
- `npm run docker:logs` - View Docker logs
- `npm run docker:clean` - Clean up Docker volumes and images

### Utilities
- `npm run install:all` - Install dependencies for all packages
- `npm run lint` - Run linting
- `npm run lint:fix` - Fix linting issues
- `npm run clean` - Remove node_modules
- `npm run clean:install` - Clean and reinstall dependencies

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3001 | Express.js API server |
| Frontend Dev | 5173 | Vite development server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Queue |
| MinIO API | 9000 | Object storage API |
| MinIO Console | 9001 | Object storage web UI |
| Adminer | 8080 | Database management UI |

## Environment Configuration

### Development Environment
Copy `env.development` to `.env` for local development:

```bash
cp env.development .env
```

### Key Environment Variables

```env
# Database
DATABASE_URL="postgresql://smart_rental:smart_rental_password@localhost:5432/smart_rental"

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Server
PORT=3001
FRONTEND_URL=http://localhost:3002
```

## VS Code Development

### Using Dev Containers

1. Install the "Dev Containers" extension in VS Code
2. Open the project in VS Code
3. When prompted, click "Reopen in Container"
4. VS Code will automatically:
   - Start the infrastructure services
   - Install all dependencies
   - Configure the development environment

### Manual VS Code Setup

1. Open the project in VS Code
2. Install recommended extensions
3. Start infrastructure: `npm run dev:infra`
4. Start development servers: `npm run dev`

## Switching Between Development Modes

### Local Development (Recommended)
```bash
npm run dev:setup
```

### Full Docker Development
```bash
npm run docker:build
```

### Production Testing
```bash
npm run docker:build
# Test the full containerized application
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :3001
   # Kill the process or change the port
   ```

2. **Database connection issues**
   ```bash
   # Restart infrastructure
   npm run dev:infra:down
   npm run dev:infra
   ```

3. **Node modules issues**
   ```bash
   # Clean and reinstall
   npm run clean:install
   ```

4. **Docker issues**
   ```bash
   # Clean Docker
   npm run docker:clean
   # Restart Docker Desktop
   ```

### Database Management

```bash
# Access database via Adminer
# Open http://localhost:8080
# Server: postgres
# Username: postgres
# Password: postgres
# Database: smart_rental_dev

# Or use Prisma Studio
npm run db:studio
```

### File Storage

```bash
# Access MinIO Console
# Open http://localhost:9001
# Username: minioadmin
# Password: minioadmin
```

## Production Deployment

Before deploying to production:

1. **Test full Docker setup**
   ```bash
   npm run docker:build
   # Verify everything works
   ```

2. **Update environment variables**
   - Copy production environment variables
   - Update secrets and API keys

3. **Build production images**
   ```bash
   docker compose -f docker-compose.yml build
   ```

## Best Practices

1. **Always use the hybrid approach for development**
   - Faster iteration
   - Better debugging
   - Easier testing

2. **Test Docker setup before releases**
   - Ensures production parity
   - Catches containerization issues

3. **Use environment-specific configs**
   - `env.development` for local dev
   - `.env.production` for production

4. **Keep infrastructure in Docker**
   - Consistent database versions
   - Easy service management
   - Production-like environment

5. **Use VS Code Dev Containers for team onboarding**
   - Consistent development environment
   - Automatic setup
   - Isolated dependencies
