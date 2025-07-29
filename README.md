# Smart Rental System - Backend

A Node.js and Express backend API for the Smart Rental System with Prisma ORM and PostgreSQL.

## Features

- 🚀 Express.js with ESModules
- 🗄️ Prisma ORM with PostgreSQL
- 🔐 User authentication system (ready for implementation)
- 📊 User roles: Tenant, Landlord, Admin
- 🏥 Health check endpoints
- 🔄 Hot reload with nodemon

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-rental-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/smart_rental_db"

   # JWT Configuration (for future use)
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d

   # API Configuration
   API_VERSION=v1
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database (for development)
   npm run db:push

   # Or run migrations (for production)
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

## Database Schema

### User Model
- `id` (String, CUID) - Primary key
- `name` (String) - User's full name
- `email` (String, Unique) - User's email address
- `password` (String) - Hashed password
- `role` (UserRole) - User role: TENANT, LANDLORD, or ADMIN
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

## API Endpoints

### Health Check
- `GET /health` - Server and database health status

### Ping
- `GET /api/ping` - Simple ping endpoint returning `{ ok: true }`

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ name, email, password, role? }`
  - Role: `TENANT` or `LANDLORD` (defaults to `TENANT`)
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ user, token }`
- `GET /api/auth/me` - Get current user info (protected)
  - Headers: `Authorization: Bearer <token>`

### Rental Requests (Tenant Only)
- `POST /api/rental-request` - Create rental request
  - Body: `{ title, description?, location, moveInDate, budget, bedrooms?, bathrooms?, furnished?, parking?, petsAllowed? }`
  - Headers: `Authorization: Bearer <token>`
- `GET /api/my-requests` - Get my rental requests
  - Headers: `Authorization: Bearer <token>`
- `GET /api/offers/:requestId` - Get offer for my request
  - Headers: `Authorization: Bearer <token>`

### Rental Requests (Landlord Only)
- `GET /api/rental-requests` - Get all active rental requests
  - Headers: `Authorization: Bearer <token>`
- `POST /api/rental-request/:requestId/offer` - Create offer for request
  - Body: `{ rentAmount, depositAmount?, leaseDuration, description?, availableFrom, utilitiesIncluded? }`
  - Headers: `Authorization: Bearer <token>`

### Payments
- `POST /api/create-payment-intent` - Create Stripe payment intent
  - Body: `{ amount, rentalRequestId?, purpose }`
  - Purpose: `DEPOSIT` or `RENT`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ clientSecret, paymentId, amount, purpose }`
- `GET /api/my-payments` - Get my payment history
  - Headers: `Authorization: Bearer <token>`

### Lock Status
- `GET /api/rental-request/:id/lock-status` - Get rental request lock status
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ rentalRequestId, title, isLocked, status, hasAcceptedOffer }`

### Admin (Admin Only)
- `POST /api/admin/trigger-daily-check` - Manually trigger daily rental check
  - Headers: `Authorization: Bearer <token>`

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reload
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Run database migrations (production)
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:reset` - Reset database and run all migrations

## Project Structure

```
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── .env.example          # Environment variables template
├── prisma/
│   └── schema.prisma     # Database schema
├── lib/
│   └── prisma.js         # Prisma client configuration
├── routes/
│   └── ping.js           # Ping route
├── controllers/           # Route controllers (placeholder)
├── middlewares/          # Custom middlewares (placeholder)
└── models/               # Data models (placeholder)
```

## Development

### Authentication
The backend includes a complete authentication system with:
- **bcrypt** for password hashing (12 salt rounds)
- **JWT** for token-based authentication
- **Role-based access control** (TENANT, LANDLORD, ADMIN)
- **Protected routes** using `verifyToken` middleware

#### Example Usage:
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"TENANT"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Access protected route
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your_jwt_token>"
```

### Adding New Routes
1. Create a new route file in `/routes`
2. Import and use in `server.js`

### Adding New Models
1. Add the model to `prisma/schema.prisma`
2. Run `npm run db:generate` to update the client
3. Run `npm run db:push` to apply changes

### Database Management
- Use `npm run db:studio` to open Prisma Studio for visual database management
- Use `npm run db:migrate` to create and apply migrations
- Use `npm run db:reset` to reset the database (⚠️ destructive)

### Stripe Integration
The backend includes Stripe payment processing with:
- **Payment Intents**: Create secure payment intents for PLN currency
- **Webhook Handling**: Automatic payment status updates via Stripe webhooks
- **Payment Logging**: All payments are logged in the database with status tracking
- **Metadata Support**: Payments are linked to users and rental requests

### Automated Rental Management
The backend includes automated rental management with:
- **Daily Cron Job**: Runs every day at 00:00 (Warsaw time)
- **Rent Payment Monitoring**: Checks if rent has been paid for the current month
- **Automatic Locking**: Locks rental requests if rent is unpaid after the 10th of the month
- **Lock Status Tracking**: Tracks which rental requests are locked due to unpaid rent

#### Stripe Setup:
1. Create a Stripe account and get your API keys
2. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Set up webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/stripe-webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### Example Payment Flow:
```bash
# Create payment intent
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500,
    "purpose": "DEPOSIT",
    "rentalRequestId": "request_id_here"
  }'

# Use client_secret in frontend Stripe.js
# Webhook will automatically update payment status
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required for auth |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key | Required for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Required for webhooks |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 