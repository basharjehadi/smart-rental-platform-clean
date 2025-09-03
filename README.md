# Smart Rental Platform

A full-stack, multi-user rental management system featuring a **reverse marketplace** where tenants post rental requests and landlords make competitive offers. This innovative approach flips the traditional rental model, empowering tenants to define their needs while landlords compete for their business. The platform seamlessly connects landlords and tenants, supporting individual, group, and business rentals with streamlined workflows from request posting to contract signing, featuring advanced automation, real-time communication, and comprehensive user management. Built as a scalable SaaS solution for the modern rental market.

## Key Features

### 🏠 **Core Marketplace Features**
- **Reverse Marketplace**: Innovative tenant-driven model where tenants post rental requests and landlords compete with competitive offers, flipping traditional rental dynamics.
- **Smart Request Pool System**: Advanced matching algorithm with 5-minute delay system and dynamic expiration (3 days before move-in).
- **Property-Based Availability**: Scalable property management system supporting unlimited properties per landlord with individual availability controls.

### 👥 **User Management & Authentication**
- **Role-Based Access Control**: Separate dashboards and functionalities for Tenants, Landlords, and Admins with secure authentication and authorization.
- **Social Login Integration**: Google OAuth authentication for seamless user onboarding.
- **KYC Verification System**: Comprehensive identity verification with document upload and admin approval workflow.
- **Trust Level System**: Dynamic user ranking (NEW_USER, RELIABLE, TRUSTED, EXCELLENT) based on reviews, payments, and activity.

### 🏢 **Advanced Rental Workflows**
- **Multi-Tenant Support**: Individual Tenants, Group Tenants (with invitation system), and Business Tenants (with occupant management).
- **Organization Management**: Business landlords with seamless upgrade path, organization management, and member roles (OWNER, ADMIN, AGENT).
- **Tenant Group System**: Group-based tenancy with primary member designation, invitation system, and ownership transfer capabilities.

### 📄 **Contract & Legal Features**
- **Automated Contract Generation**: Dynamically creates and populates bilingual (English/Polish) PDF rental agreements based on user data and property details.
- **LibreTranslate Integration**: Powered by LibreTranslate for accurate language localization and real-time translation.
- **Digital Signatures**: Securely capture and embed digital signatures from all parties into the final contract for legal compliance.
- **Lease Lifecycle Management**: Complete lease management with termination notices, renewal handling, and automatic property marketing.

### 💬 **Communication & Notifications**
- **Real-Time Messaging**: Fully integrated chat system with offer-based conversations, payment-gated access, and Socket.IO real-time communication.
- **Smart Notification System**: Separated business and system notifications with real-time updates and role-based filtering.
- **Support Ticket System**: Comprehensive support system with ticket creation, admin management, and status tracking.

### 💰 **Payment & Financial Management**
- **Multi-Gateway Payment Processing**: Support for Stripe, PayU, Przelewy24, and Tpay with comprehensive payment tracking.
- **Monthly Rent System**: Automated monthly rent collection with payment schedules, proration calculations, and overdue tracking.
- **Refund System**: Automated refund processing with provider-specific implementations and real-time notifications.
- **Payment Analytics**: Comprehensive payment tracking with landlord filtering and unified payment data.

### 🏠 **Move-In & Verification System**
- **Extended Move-In Window**: From payment date until 2 days after expected move-in date for comprehensive issue reporting.
- **One Issue Per Rental**: Only one move-in issue allowed per rental - for serious problems that warrant contract cancellation.
- **Move-In Issue Reporting**: Three-way communication system (tenant, landlord, admin) for issue resolution with evidence upload.
- **Admin Decision System**: Admin approval workflow for move-in cancellations with automatic refund processing.

### ⭐ **Review & Gamification System**
- **2-Stage Review System**: MOVE_IN (visible feedback, no score impact) and END_OF_LEASE (affects rating) reviews with weighted calculations.
- **Badge System**: Gamification with Perfect Payer, Accurate Host, and Quick Responder badges for user engagement.
- **Bidirectional Reviews**: Both landlords and tenants can review each other to build trust and reputation.

### 🛠️ **Technical Excellence**
- **Modern Tech Stack**: React 19, Node.js, Express.js, Prisma ORM, PostgreSQL, Socket.IO, and TailwindCSS.
- **Real-Time Architecture**: Socket.IO for live updates, notifications, and chat functionality.
- **Comprehensive API**: RESTful API with 50+ endpoints covering all system functionality.
- **Code Quality**: Professionally refactored with clean architecture, centralized documentation, and Prettier formatting.

## 🏠 Move-In Verification System

The Smart Rental System features a comprehensive move-in verification process with three distinct phases:

### **Phase 1: PRE_MOVE_IN**
- **Timeline**: Before payment date
- **Status**: "Issue window opens from payment date and closes 2 days after move-in date"
- **Actions**: No action buttons available

### **Phase 2: WINDOW_OPEN** 
- **Timeline**: From payment date until 2 days after expected move-in date
- **Status**: "Issue window is open! You can report issues from payment date until [close date]"
- **Actions**: 
  - ✅ **Confirm Move-In** - Tenant confirms successful move-in
  - ❌ **Deny Move-In** - Tenant reports issues
  - 🚨 **Report Issue** - Submit detailed issue reports

### **Phase 3: WINDOW_CLOSED**
- **Timeline**: After 2 days past expected move-in date
- **Status**: "Issue window closed (2 days after move-in date)"
- **Actions**: No action buttons available

### **API Endpoints**:
- `GET /api/move-in/offers/:id/status` - Get verification status
- `GET /api/move-in/offers/:id/move-in/ui-state` - Get UI state and phase information
- `POST /api/move-in/offers/:id/verify` - Confirm move-in  
- `POST /api/move-in/offers/:id/deny` - Deny move-in
- `POST /api/move-in-issues` - Report move-in issues

### **Frontend Access**: 
Navigate to `/move-in?offerId=YOUR_OFFER_ID` to access the Move-In Center.

### **Issue Resolution Flow**:
1. **Tenant Reports Issue** → Upload evidence and detailed description
2. **Landlord Response** → Landlord can respond with solutions
3. **Admin Decision** → Admin reviews and makes final decision
4. **Automatic Refunds** → If approved, system automatically processes refunds

## 🛠️ Tech Stack

### **Frontend**
- **React 19** - Latest React framework with modern hooks and features
- **Vite** - Fast build tool and development server with hot module replacement
- **TailwindCSS** - Utility-first CSS framework for rapid UI development
- **Socket.IO Client** - Real-time communication capabilities
- **React Router** - Client-side routing and navigation
- **Axios** - HTTP client with automatic authorization and error handling

### **Backend**
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Fast, unopinionated web framework with middleware support
- **Prisma ORM** - Type-safe database client with migrations and schema management
- **Socket.IO** - Real-time bidirectional communication for chat and notifications
- **JWT** - Secure authentication and authorization with role-based access control
- **Bcrypt** - Password hashing and security
- **Multer** - File upload handling for documents and images
- **LibreTranslate** - Open-source machine translation service for bilingual contract generation

### **Database & Infrastructure**
- **PostgreSQL** - Robust, open-source relational database with advanced features
- **Redis** - In-memory data store for caching and session management
- **Docker** - Containerization for consistent development and deployment
- **Adminer** - Web-based database administration tool

### **Payment & External Services**
- **Stripe** - Payment processing for international transactions
- **PayU** - Payment gateway for European markets
- **Przelewy24 (P24)** - Polish payment system integration
- **Tpay** - Additional payment gateway support
- **Google OAuth** - Social authentication integration

### **Development Tools**
- **Prettier** - Code formatting and style consistency
- **ESLint** - Code linting and quality assurance
- **Prisma Studio** - Database management and visualization
- **Docker Compose** - Multi-container application orchestration

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- PostgreSQL database
- LibreTranslate service (for bilingual contract generation)

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

5. **LibreTranslate Setup**
   ```bash
   # Start LibreTranslate service (from root directory)
   npm run translate:start
   
   # Or manually start with Docker
   docker-compose -f docker-compose.translate.yml up -d
   ```

6. **Start the Application**
   ```bash
   # Start backend server (from backend directory)
   npm run dev
   
   # Start frontend development server (from frontend directory)
   npm run dev
   ```

7. **Access the Application**
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
npm run translate:start  # Start LibreTranslate service
npm run translate:stop   # Stop LibreTranslate service
npm run translate:logs   # View LibreTranslate logs
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

## 📚 Documentation

This project includes comprehensive documentation covering all aspects of the system:

### **🚀 Getting Started**
- [Quick Start Guide](docs/QUICK_START.md) - Quick setup and getting started
- [Docker Setup](docs/DOCKER_SETUP.md) - Docker configuration and setup
- [Hybrid Dev Setup](docs/HYBRID_DEV_SETUP.md) - Development environment configuration
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - System deployment instructions

### **🔌 API & Integration**
- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference with 50+ endpoints
- [Organization API Implementation](docs/ORGANIZATION_API_IMPLEMENTATION.md) - Business organization management
- [Tenant Group API Implementation](docs/TENANT_GROUP_API_IMPLEMENTATION.md) - Tenant group functionality
- [Tenant Group UI Summary](docs/TENANT_GROUP_UI_SUMMARY.md) - Frontend tenant group features

### **🏠 Core Business Features**
- [Landlord Journey System](docs/LANDLORD_JOURNEY_SYSTEM.md) - Landlord onboarding and workflow
- [Request Pool System](docs/REQUEST_POOL_SYSTEM.md) - Smart rental request matching system
- [Property Availability System](docs/PROPERTY_AVAILABILITY_SYSTEM.md) - Property availability management
- [Move-In Issue System](docs/MOVE_IN_ISSUE_SYSTEM.md) - Move-in verification and issue reporting

### **🏢 Business & Organization Management**
- [Business Account Upgrade UI](docs/BUSINESS_ACCOUNT_UPGRADE_UI.md) - Business account management
- [Business Occupant Management](docs/BUSINESS_OCCUPANT_MANAGEMENT_SUMMARY.md) - Occupant management system
- [Lease Lifecycle](docs/LEASE_LIFECYCLE.md) - Complete lease management workflow

### **💰 Payment & Financial Systems**
- [Monthly Payment System](docs/MONTHLY_PAYMENT_SYSTEM_DOCUMENTATION.md) - Payment processing and tracking
- [Refunds System](docs/REFUNDS.md) - Automated refund processing
- [Badge System](docs/BADGE_SYSTEM.md) - Gamification and user rewards

### **📄 Contract & Legal**
- [Dynamic Contract Generation](docs/DYNAMIC_CONTRACT_GENERATION.md) - Automated contract creation
- [Enhanced Contract Template](docs/ENHANCED_CONTRACT_TEMPLATE.md) - Bilingual contract templates
- [LibreTranslate Setup](docs/LIBRETRANSLATE_SETUP.md) - Translation service configuration

### **💬 Communication & Reviews**
- [Chat System Documentation](docs/README_CHAT_SYSTEM.md) - Real-time messaging system
- [Review System Documentation](docs/REVIEW_SYSTEM_DOCUMENTATION.md) - 3-stage review system
- [Notification System Update](docs/NOTIFICATION_SYSTEM_UPDATE.md) - Smart notification management
- [Messaging Tests](docs/README_MESSAGING_TESTS.md) - Messaging system testing

### **👨‍💼 Admin & Management**
- [Admin Dashboard Documentation](docs/ADMIN_DASHBOARD_DOCUMENTATION.md) - Admin panel and management features
- [Database Cleanup Guide](docs/DATABASE_CLEANUP_GUIDE.md) - Database maintenance procedures

### **🔄 System Updates & Migration**
- [Migration Summary](docs/MIGRATION_SUMMARY.md) - Database migration history
- [Updated Rental Request Logic](docs/UPDATED_RENTAL_REQUEST_LOGIC.md) - Rental request system updates

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

## 🚀 Business Vision

Smart Rental Platform is positioned as a disruptive force in the traditional rental market, offering:

### **🎯 Market Disruption**
- **Reverse Marketplace Model**: Challenges conventional landlord-centric approaches by empowering tenants
- **Technology-First Approach**: Leverages AI, real-time communication, and automation for superior user experience
- **Comprehensive Solution**: End-to-end rental management from request to contract signing and beyond

### **📈 Scalable SaaS Architecture**
- **Multi-Tenant Architecture**: Built for rapid expansion across multiple markets and regions
- **Modular Design**: Feature-rich system with 50+ API endpoints and comprehensive functionality
- **Real-Time Capabilities**: Socket.IO integration for live updates, chat, and notifications
- **Multi-Language Support**: Bilingual contracts and LibreTranslate integration for international expansion

### **💰 Revenue Streams**
- **Transaction Fees**: Commission on successful rental transactions
- **Subscription Models**: Premium features for landlords and business accounts
- **Payment Processing**: Revenue from payment gateway integrations
- **Premium Services**: Advanced analytics, priority support, and enhanced features

### **🌍 Market Opportunity**
- **Growing Demand**: Targeting the increasing need for flexible, technology-driven rental solutions
- **Digital Transformation**: Capitalizing on the shift from traditional to digital rental processes
- **Trust & Safety**: Comprehensive KYC, review systems, and move-in verification for secure transactions
- **Business Focus**: Supporting both individual and business rental needs with organization management

## 📸 Key Features Showcase

### **🏠 Core Platform Features**
*[Landlord Dashboard with Property Management]*
*[Tenant Rental Request Creation]*
*[Smart Request Pool Matching System]*
*[Property Availability Management]*

### **🏢 Business & Organization Features**
*[Business Account Upgrade Interface]*
*[Organization Management Dashboard]*
*[Tenant Group Management]*
*[Occupant Management System]*

### **📄 Contract & Legal Features**
*[Generated Bilingual PDF Contract]*
*[Digital Signature Capture]*
*[Contract Generation Process]*
*[Lease Lifecycle Management]*

### **💬 Communication & Reviews**
*[Real-Time Chat Interface]*
*[Move-In Verification Center]*
*[Issue Reporting System]*
*[3-Stage Review System]*

### **💰 Payment & Financial**
*[Payment Processing Flow]*
*[Monthly Rent Management]*
*[Refund Processing System]*
*[Payment Analytics Dashboard]*

### **👨‍💼 Admin & Management**
*[Admin Dashboard]*
*[KYC Verification System]*
*[Support Ticket Management]*
*[System Analytics]*

### **⭐ Gamification & Trust**
*[Badge System Display]*
*[Trust Level Indicators]*
*[User Ranking System]*
*[Review and Rating Interface]*

## Development & Collaboration

This is a private commercial project. For internal development:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Create a Pull Request for review

## License & Usage

This is proprietary software owned by Smart Rental Platform. All rights reserved.

## Support & Contact

For internal support and questions, please contact the development team directly.

---

**Smart Rental Platform** - Revolutionizing the rental experience through technology and automation.