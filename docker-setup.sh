#!/bin/bash

# Smart Rental System Docker Setup Script

echo "🚀 Smart Rental System Docker Setup"
echo "=================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to build and start services
start_services() {
    echo "🔨 Building and starting services..."
    docker-compose up --build -d
    echo "✅ Services started successfully!"
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping services..."
    docker-compose down
    echo "✅ Services stopped!"
}

# Function to view logs
view_logs() {
    echo "📋 Viewing logs..."
    docker-compose logs -f
}

# Function to restart services
restart_services() {
    echo "🔄 Restarting services..."
    docker-compose down
    docker-compose up --build -d
    echo "✅ Services restarted!"
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup completed!"
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
}

# Function to access backend shell
backend_shell() {
    echo "🐚 Accessing backend shell..."
    docker-compose exec backend sh
}

# Function to access frontend shell
frontend_shell() {
    echo "🐚 Accessing frontend shell..."
    docker-compose exec frontend sh
}

# Function to run database commands
db_commands() {
    echo "🗄️  Running database commands..."
    docker-compose exec backend npx prisma db push
    docker-compose exec backend npx prisma generate
    echo "✅ Database commands completed!"
}

# Function to seed database
seed_database() {
    echo "🌱 Seeding database..."
    docker-compose exec backend node scripts/seed.js
    echo "✅ Database seeded!"
}

# Main menu
case "$1" in
    "start")
        check_docker
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        check_docker
        restart_services
        ;;
    "logs")
        view_logs
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "backend")
        backend_shell
        ;;
    "frontend")
        frontend_shell
        ;;
    "db")
        db_commands
        ;;
    "seed")
        seed_database
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|cleanup|backend|frontend|db|seed}"
        echo ""
        echo "Commands:"
        echo "  start    - Build and start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View logs from all services"
        echo "  status   - Show service status"
        echo "  cleanup  - Clean up Docker resources"
        echo "  backend  - Access backend container shell"
        echo "  frontend - Access frontend container shell"
        echo "  db       - Run database commands"
        echo "  seed     - Seed the database with initial data"
        exit 1
        ;;
esac
