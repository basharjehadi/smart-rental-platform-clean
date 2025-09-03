# Quick Start Guide

Get the Smart Rental System up and running in minutes!

## Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Docker** and **Docker Compose** (optional, for containerized setup)
- **PostgreSQL** 13+ and **Redis** 6+ (if not using Docker)

## Option 1: Docker Setup (Recommended)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd smart-rental-system
```

### 2. Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/system/status
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)

### 4. Run Database Migrations

```bash
# Access backend container
docker-compose exec backend npm run db:migrate
```

## Option 2: Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd smart-rental-system

# Install all dependencies
npm run install:all
```

### 2. Setup Database

```bash
# Start PostgreSQL and Redis on your system
# Create database
createdb smart_rental

# Run migrations
npm run db:migrate
```

### 3. Environment Setup

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your database credentials
```

### 4. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

## Option 3: Production-like Setup

### 1. Build and Start

```bash
# Build both applications
npm run build

# Start production servers
npm start
```

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev                    # Start both servers
npm run dev:backend           # Start backend only
npm run dev:frontend          # Start frontend only

# Building
npm run build                 # Build both applications
npm run build:backend         # Build backend only
npm run build:frontend        # Build frontend only

# Testing
npm test                      # Run all tests
npm run test:backend          # Run backend tests
npm run test:frontend         # Run frontend tests

# Code Quality
npm run lint                  # Lint all code
npm run lint:fix              # Fix linting issues
npm run format                # Format all code

# Database
npm run db:migrate            # Run database migrations
npm run db:generate           # Generate Prisma client
npm run db:studio             # Open Prisma Studio

# Docker
npm run docker:up             # Start Docker services
npm run docker:down           # Stop Docker services
npm run docker:logs           # View Docker logs
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database
npm run db:reset

# Generate Prisma client after schema changes
npm run db:generate
```

### File Structure

```
smart-rental-system/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── validators/     # Input validation
│   ├── prisma/             # Database schema
│   └── uploads/            # File uploads
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Frontend utilities
│   └── public/             # Static assets
├── shared/                 # Shared types and constants
├── docs/                   # Documentation
└── docker-compose.yml      # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details

### Rental Requests
- `POST /api/rental-requests` - Create rental request
- `GET /api/rental-requests` - List rental requests

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `GET /api/payments/history` - Payment history

## Testing

### Backend Tests

```bash
cd backend
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage
```

### Frontend Tests

```bash
cd frontend
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3001
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   # Start if needed
   sudo systemctl start postgresql
   ```

3. **Docker issues**
   ```bash
   # Clean up Docker
   docker-compose down -v
   docker system prune -a
   # Restart
   docker-compose up -d
   ```

4. **Node modules issues**
   ```bash
   # Clean and reinstall
   npm run clean
   npm run install:all
   ```

### Getting Help

- Check the logs: `npm run docker:logs` or `docker-compose logs -f`
- Review the [API Documentation](docs/API_DOCUMENTATION.md)
- Check the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- Create an issue in the repository

## Next Steps

1. **Explore the Codebase**: Start with the main components and pages
2. **Read the Documentation**: Check the `/docs` folder for detailed guides
3. **Run Tests**: Ensure everything is working correctly
4. **Make Changes**: Start developing your features
5. **Deploy**: Use the deployment guide for production setup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

Happy coding! 🚀 