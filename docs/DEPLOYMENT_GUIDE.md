# Smart Rental System Deployment Guide

This guide covers deploying the Smart Rental System to various environments, from development to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Development Deployment](#development-deployment)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment](#cloud-deployment)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **PostgreSQL**: 13.x or higher
- **Redis**: 6.x or higher
- **Git**: Latest version

### Optional Requirements

- **Docker**: 20.x or higher (for containerized deployment)
- **PM2**: For process management
- **Nginx**: For reverse proxy
- **SSL Certificate**: For HTTPS

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-rental-system
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

Create environment files for different environments:

#### Development (.env.development)
```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smart_rental_dev"

# JWT
JWT_SECRET=your_development_jwt_secret
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_development_session_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# Redis
REDIS_URL=redis://localhost:6379

# Email (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Production (.env.production)
```env
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://username:password@your-db-host:5432/smart_rental_prod"

# JWT
JWT_SECRET=your_very_secure_production_jwt_secret
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_very_secure_production_session_secret

# Frontend
FRONTEND_URL=https://your-domain.com

# Redis
REDIS_URL=redis://your-redis-host:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Stripe (live keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## Development Deployment

### 1. Database Setup

```bash
# Start PostgreSQL and Redis
# (Install and start these services on your system)

# Create database
createdb smart_rental_dev

# Run migrations
cd backend
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 2. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 3. Verify Installation

- Backend: http://localhost:3001/health
- Frontend: http://localhost:5173
- API: http://localhost:3001/api/ping

## Staging Deployment

### 1. Prepare Staging Environment

```bash
# Create staging environment
mkdir staging
cd staging

# Clone repository
git clone <repository-url> .
git checkout staging

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install --production
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

### 3. Configure Environment

```bash
# Copy environment file
cp .env.staging backend/.env
cp .env.staging frontend/.env
```

### 4. Database Setup

```bash
cd backend
npm run db:migrate
```

### 5. Start Services

```bash
# Using PM2 for process management
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name "smart-rental-backend"

# Start frontend (if serving from Node.js)
cd ../frontend
pm2 start npm --name "smart-rental-frontend" -- run preview
```

## Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Create database user
sudo -u postgres createuser --interactive smart_rental

# Create database
sudo -u postgres createdb smart_rental_prod

# Set password
sudo -u postgres psql
ALTER USER smart_rental WITH PASSWORD 'your_secure_password';
\q
```

### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/smart-rental
sudo chown $USER:$USER /var/www/smart-rental

# Clone repository
cd /var/www/smart-rental
git clone <repository-url> .

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install --production

# Build frontend
npm run build

# Copy environment file
cp .env.production backend/.env
```

### 4. Database Migration

```bash
cd backend
npm run db:migrate
```

### 5. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'smart-rental-backend',
      script: 'src/server.js',
      cwd: '/var/www/smart-rental/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/smart-rental/backend-error.log',
      out_file: '/var/log/smart-rental/backend-out.log',
      log_file: '/var/log/smart-rental/backend-combined.log',
      time: true
    }
  ]
};
```

### 6. Start Application

```bash
# Create log directory
sudo mkdir -p /var/log/smart-rental
sudo chown $USER:$USER /var/log/smart-rental

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 7. Nginx Configuration

Create `/etc/nginx/sites-available/smart-rental`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/smart-rental/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/smart-rental /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Docker Deployment

### 1. Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 2. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: smart_rental
      POSTGRES_USER: smart_rental
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://smart_rental:your_password@postgres:5432/smart_rental
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Setup

```bash
# Launch EC2 instance
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. RDS Setup

- Create PostgreSQL RDS instance
- Configure security groups
- Update DATABASE_URL in environment

#### 3. ElastiCache Setup

- Create Redis ElastiCache cluster
- Configure security groups
- Update REDIS_URL in environment

#### 4. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd smart-rental-system

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Heroku Deployment

#### 1. Heroku Setup

```bash
# Install Heroku CLI
# Create Heroku app
heroku create smart-rental-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev
```

#### 2. Deploy Backend

```bash
cd backend
heroku git:remote -a smart-rental-app
git add .
git commit -m "Deploy backend"
git push heroku main

# Run migrations
heroku run npm run db:migrate
```

#### 3. Deploy Frontend

```bash
cd frontend
# Update API URL to Heroku backend
# Build and deploy to static hosting (Netlify, Vercel, etc.)
```

## Monitoring and Logging

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs smart-rental-backend

# Application metrics
pm2 show smart-rental-backend
```

### 2. System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
```

### 3. Log Management

```bash
# View application logs
tail -f /var/log/smart-rental/backend-combined.log

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 4. Health Checks

```bash
# Application health
curl http://localhost:3001/health

# Database health
psql -h localhost -U smart_rental -d smart_rental_prod -c "SELECT 1;"

# Redis health
redis-cli ping
```

## Backup and Recovery

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/smart-rental"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U smart_rental smart_rental_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Upload files backup
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/smart-rental/backend/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 2. Recovery Procedures

```bash
# Database recovery
psql -h localhost -U smart_rental -d smart_rental_prod < backup_file.sql

# Upload files recovery
tar -xzf uploads_backup.tar.gz -C /
```

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, unique secrets for each environment
- Rotate secrets regularly

### 2. Database Security

```bash
# Configure PostgreSQL security
sudo -u postgres psql
ALTER USER smart_rental WITH PASSWORD 'strong_password';
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE smart_rental_prod TO smart_rental;
\q
```

### 3. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3001  # Don't expose backend directly
```

### 4. SSL/TLS

- Always use HTTPS in production
- Configure secure headers in Nginx
- Use HSTS headers

### 5. Rate Limiting

```nginx
# Add to Nginx configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api {
    limit_req zone=api burst=20 nodelay;
    # ... other configuration
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U smart_rental -d smart_rental_prod
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **Application Not Starting**
   ```bash
   # Check logs
   pm2 logs smart-rental-backend
   
   # Check environment
   pm2 env smart-rental-backend
   ```

4. **Nginx Issues**
   ```bash
   # Check configuration
   sudo nginx -t
   
   # Check status
   sudo systemctl status nginx
   ```

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Optimize slow queries
   - Configure connection pooling

2. **Application Optimization**
   - Enable compression
   - Use caching strategies
   - Optimize images and assets

3. **Server Optimization**
   - Configure swap space
   - Optimize kernel parameters
   - Use CDN for static assets

## Support

For deployment issues:
- Check application logs
- Review system resources
- Verify configuration files
- Contact the development team 