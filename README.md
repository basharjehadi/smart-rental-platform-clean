# Smart Rental System

A comprehensive rental management platform with landlord and tenant portals, payment processing, and automated contract generation.

## 🏗️ Project Structure

```
smart-rental-system/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middlewares/       # Express middlewares
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── validators/        # Input validation schemas
│   ├── prisma/                # Database schema and migrations
│   ├── uploads/               # File uploads
│   └── tests/                 # Backend tests
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service functions
│   │   ├── styles/            # CSS and styling
│   │   └── utils/             # Frontend utilities
│   └── public/                # Static assets
├── shared/                    # Shared types and utilities
└── docs/                      # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Redis (for caching and sessions)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run db:migrate
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📋 Features

### Core Features
- **User Management**: Multi-role authentication (Admin, Landlord, Tenant)
- **Property Management**: CRUD operations for rental properties
- **Rental Requests**: Tenant request system with matching algorithm
- **Payment Processing**: Stripe integration for rent payments
- **Contract Generation**: Automated PDF contract creation
- **File Management**: Secure file upload and storage
- **Notifications**: Email and in-app notifications

### Advanced Features
- **Social Authentication**: Google and Facebook OAuth
- **Multi-language Support**: Internationalization (i18n)
- **Cron Jobs**: Automated rent collection and reminders
- **Digital Signatures**: Contract signing workflow
- **KYC Verification**: Identity document verification
- **Smart Matching**: AI-powered tenant-property matching

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport.js
- **File Storage**: Local file system
- **Payment**: Stripe API
- **Email**: Nodemailer
- **PDF Generation**: Puppeteer
- **Caching**: Redis
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Internationalization**: i18next
- **Payment**: Stripe React components

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smart_rental"

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_session_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth

### Property Endpoints
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get property details
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Rental Endpoints
- `POST /api/rental-requests` - Create rental request
- `GET /api/rental-requests` - List rental requests
- `POST /api/offers` - Create offer
- `GET /api/offers` - List offers

### Payment Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added social authentication
- **v1.2.0** - Added payment processing
- **v1.3.0** - Added contract generation
- **v1.4.0** - Added multi-language support 