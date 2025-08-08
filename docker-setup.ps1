# Smart Rental System Docker Setup Script (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command
)

Write-Host "Smart Rental System Docker Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Host "Docker is running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        return $false
    }
}

# Function to build and start services
function Start-Services {
    Write-Host "Building and starting services..." -ForegroundColor Yellow
    docker-compose up --build -d
    Write-Host "Services started successfully!" -ForegroundColor Green
}

# Function to stop services
function Stop-Services {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "Services stopped!" -ForegroundColor Green
}

# Function to view logs
function Show-Logs {
    Write-Host "Viewing logs..." -ForegroundColor Yellow
    docker-compose logs -f
}

# Function to restart services
function Restart-Services {
    Write-Host "Restarting services..." -ForegroundColor Yellow
    docker-compose down
    docker-compose up --build -d
    Write-Host "Services restarted!" -ForegroundColor Green
}

# Function to clean up
function Clear-DockerResources {
    Write-Host "Cleaning up Docker resources..." -ForegroundColor Yellow
    docker-compose down -v
    docker system prune -f
    Write-Host "Cleanup completed!" -ForegroundColor Green
}

# Function to show status
function Show-Status {
    Write-Host "Service Status:" -ForegroundColor Yellow
    docker-compose ps
}

# Function to access backend shell
function Enter-BackendShell {
    Write-Host "Accessing backend shell..." -ForegroundColor Yellow
    docker-compose exec backend sh
}

# Function to access frontend shell
function Enter-FrontendShell {
    Write-Host "Accessing frontend shell..." -ForegroundColor Yellow
    docker-compose exec frontend sh
}

# Function to run database commands
function Invoke-DatabaseCommands {
    Write-Host "Running database commands..." -ForegroundColor Yellow
    docker-compose exec backend npx prisma db push
    docker-compose exec backend npx prisma generate
    Write-Host "Database commands completed!" -ForegroundColor Green
}

# Function to seed database
function Invoke-SeedDatabase {
    Write-Host "Seeding database..." -ForegroundColor Yellow
    docker-compose exec backend node scripts/seed.js
    Write-Host "Database seeded!" -ForegroundColor Green
}

# Main switch statement
switch ($Command) {
    "start" {
        if (Test-Docker) {
            Start-Services
        }
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        if (Test-Docker) {
            Restart-Services
        }
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "cleanup" {
        Clear-DockerResources
    }
    "backend" {
        Enter-BackendShell
    }
    "frontend" {
        Enter-FrontendShell
    }
    "db" {
        Invoke-DatabaseCommands
    }
    "seed" {
        Invoke-SeedDatabase
    }
    default {
        Write-Host "Usage: .\docker-setup.ps1 {start|stop|restart|logs|status|cleanup|backend|frontend|db|seed}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor White
        Write-Host "  start    - Build and start all services" -ForegroundColor Gray
        Write-Host "  stop     - Stop all services" -ForegroundColor Gray
        Write-Host "  restart  - Restart all services" -ForegroundColor Gray
        Write-Host "  logs     - View logs from all services" -ForegroundColor Gray
        Write-Host "  status   - Show service status" -ForegroundColor Gray
        Write-Host "  cleanup  - Clean up Docker resources" -ForegroundColor Gray
        Write-Host "  backend  - Access backend container shell" -ForegroundColor Gray
        Write-Host "  frontend - Access frontend container shell" -ForegroundColor Gray
        Write-Host "  db       - Run database commands" -ForegroundColor Gray
        Write-Host "  seed     - Seed the database with initial data" -ForegroundColor Gray
    }
}
