# Smart Rental Platform

A full-stack, multi-user rental management system designed to connect landlords and tenants seamlessly, supporting individual, group, and business rentals. This platform streamlines the entire rental process from property discovery to contract signing, featuring advanced automation, real-time communication, and comprehensive user management.

## Key Features

- **Role-Based Access Control**: Separate dashboards and functionalities for Tenants, Landlords, and Admins with secure authentication and authorization.
- **Dynamic Rental Workflows**: Support for Individual Tenants, Group Tenants (with an invitation system), and Business Tenants (with occupant management).
- **Advanced Landlord Accounts**: Differentiates between Private and Business landlords with a seamless upgrade path and organization management.
- **Automated Contract Generation**: Dynamically creates and populates bilingual (English/Polish) PDF rental agreements based on user data and property details.
- **Digital Signatures**: Securely capture and embed digital signatures from all parties into the final contract for legal compliance.
- **Real-Time Messaging**: A fully integrated chat system for communication between landlords and tenants with instant notifications.
- **Payment Integration**: Comprehensive payment processing with support for deposits, rent payments, and multiple payment gateways.
- **Property Management**: Advanced property listing, search, and matching algorithms with detailed filtering and location-based services.
- **Review & Rating System**: Built-in review system for both tenants and landlords to build trust and reputation.
- **Code Quality & Structure**: Professionally refactored with a clean folder structure, centralized documentation in `/docs`, and consistent code formatting with Prettier.

## Tech Stack

### Frontend
- **React** - Modern, component-based UI framework
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework for rapid UI development
- **Socket.IO Client** - Real-time communication capabilities

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Fast, unopinionated web framework
- **Prisma ORM** - Type-safe database client and migrations
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Secure authentication and authorization

### Database
- **PostgreSQL** - Robust, open-source relational database

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-rental-System
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/smart_rental_db"
   
   # Authentication
   JWT_SECRET="your-super-secret-jwt-key"
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # Payment Gateways (optional)
   STRIPE_SECRET_KEY="sk_test_..."
   PAYU_MERCHANT_ID="your-payu-merchant-id"
   PAYU_SECRET_KEY="your-payu-secret-key"
   
   # File Upload (optional)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **Database Setup**
   ```bash
   cd backend
   
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database (optional)
   npm run db:seed
   ```

5. **Start the Application**
   ```bash
   # Start backend server (from backend directory)
   npm run dev
   
   # Start frontend development server (from frontend directory)
   npm run dev
   ```

6. **Access the Application**
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:3002
   - Database Studio: http://localhost:5555 (if using Prisma Studio)

### Available Scripts

#### Root Level
```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
npm run format           # Format code with Prettier
npm run install:all      # Install dependencies for all packages
```

#### Backend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run format           # Format code with Prettier
```

#### Frontend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run format           # Format code with Prettier
```

## Documentation

This project includes comprehensive documentation covering various aspects of the system:

### **API & Integration Documentation**
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference and endpoints
- [Organization API Implementation](docs/ORGANIZATION_API_IMPLEMENTATION.md) - Organization management features
- [Tenant Group API Implementation](docs/TENANT_GROUP_API_IMPLEMENTATION.md) - Tenant group functionality
- [Tenant Group UI Summary](docs/TENANT_GROUP_UI_SUMMARY.md) - Frontend tenant group features

### **Business Features Documentation**
- [Business Account Upgrade UI](docs/BUSINESS_ACCOUNT_UPGRADE_UI.md) - Business account management
- [Business Occupant Management](docs/BUSINESS_OCCUPANT_MANAGEMENT_SUMMARY.md) - Occupant management system
- [Monthly Payment System](docs/MONTHLY_PAYMENT_SYSTEM_DOCUMENTATION.md) - Payment processing documentation
- [Property Availability System](docs/PROPERTY_AVAILABILITY_SYSTEM.md) - Property availability management
- [Landlord Journey System](docs/LANDLORD_JOURNEY_SYSTEM.md) - Landlord onboarding and workflow
- [Request Pool System](docs/REQUEST_POOL_SYSTEM.md) - Rental request management system

### **System & Technical Documentation**
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - System deployment instructions
- [Docker Setup](docs/DOCKER_SETUP.md) - Docker configuration and setup
- [Hybrid Dev Setup](docs/HYBRID_DEV_SETUP.md) - Development environment configuration
- [Quick Start Guide](docs/QUICK_START.md) - Quick setup and getting started
- [Database Cleanup Guide](docs/DATABASE_CLEANUP_GUIDE.md) - Database maintenance procedures
- [Migration Summary](docs/MIGRATION_SUMMARY.md) - Database migration history
- [Lease Lifecycle](docs/LEASE_LIFECYCLE.md) - Lease management workflow

### **Contract & Legal Documentation**
- [Enhanced Contract Template](docs/ENHANCED_CONTRACT_TEMPLATE.md) - Contract generation system
- [Dynamic Contract Generation](docs/DYNAMIC_CONTRACT_GENERATION.md) - Automated contract creation
- [Refunds System](docs/REFUNDS.md) - Refund processing documentation

### **Development & Testing**
- [Messaging Tests](docs/README_MESSAGING_TESTS.md) - Messaging system testing
- [LibreTranslate Setup](docs/LIBRETRANSLATE_SETUP.md) - Translation service configuration
- [Updated Rental Request Logic](docs/UPDATED_RENTAL_REQUEST_LOGIC.md) - Rental request system updates
- [Review System Documentation](docs/REVIEW_SYSTEM_DOCUMENTATION.md) - Comprehensive review system guide
- [Chat System Documentation](docs/README_CHAT_SYSTEM.md) - Chat and messaging system overview

### **Admin & Management**
- [Admin Dashboard Documentation](docs/ADMIN_DASHBOARD_DOCUMENTATION.md) - Admin panel and management features

For detailed information about any specific feature or system component, please refer to the appropriate documentation file in the `/docs` directory.

## Project Structure

```
Smart-rental-System/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   ├── scripts/        # Helper scripts
│   │   └── tests/          # Test files
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Frontend utilities
│   │   └── services/       # API service functions
│   └── package.json
├── docs/                    # Comprehensive documentation
├── contracts/               # Generated contract templates
└── README.md
```

## Screenshots

*[Landlord Dashboard]*
*[Tenant Rental Request Card]*
*[Generated PDF Contract]*
*[Group Tenant Management]*
*[Business Account Upgrade]*
*[Real-Time Chat Interface]*
*[Payment Processing Flow]*

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Smart Rental Platform** - Revolutionizing the rental experience through technology and automation.