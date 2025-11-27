# Docker Setup Guide

This guide explains how to run the Website Scraper SaaS application using Docker.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git

## Quick Start

### 1. Development Mode (Recommended for Development)

```bash
# Start all services
docker-compose up

# Or run in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3000
- Frontend dev server on port 5173

### 2. Production Mode

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Environment Variables

### Option 1: Using .env file (Recommended)

Create a `.env` file in the project root:

```env
POSTGRES_USER=scraper_user
POSTGRES_PASSWORD=scraper_password
POSTGRES_DB=website_scraper
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost
```

### Option 2: Export environment variables

```bash
export JWT_SECRET="your-secret-key"
export STRIPE_SECRET_KEY="sk_test_..."
# etc.
```

## First Time Setup

### 1. Start the services

```bash
docker-compose up -d
```

### 2. Wait for database to be ready

The backend will automatically run migrations when it starts. You can check logs:

```bash
docker-compose logs backend
```

### 3. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: localhost:5432

## Common Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild containers
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Database operations

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U scraper_user -d website_scraper

# Run Prisma migrations manually
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Open Prisma Studio (database GUI)
docker-compose exec backend npx prisma studio
```

### Stop and clean up

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove volumes (deletes database data!)
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload in development mode:

- **Frontend**: Changes to Vue files will automatically reload
- **Backend**: Changes to JavaScript files will automatically restart the server

### Making Code Changes

1. Edit files in your local directory
2. Changes are automatically synced to containers via volumes
3. Services will auto-reload/restart

### Installing New Dependencies

```bash
# Backend
docker-compose exec backend npm install package-name

# Frontend
docker-compose exec frontend npm install package-name
```

## Troubleshooting

### Port already in use

If ports 3000, 5173, or 5432 are already in use:

1. Stop the conflicting service, or
2. Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change host port
```

### Database connection errors

```bash
# Check if database is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Container won't start

```bash
# Check logs
docker-compose logs service-name

# Rebuild container
docker-compose build --no-cache service-name
docker-compose up -d service-name
```

### Reset everything

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Production Deployment

### 1. Set environment variables

Create a `.env` file with production values:
- Strong `JWT_SECRET`
- Production Stripe keys
- Secure database passwords
- Production `FRONTEND_URL`

### 2. Build and start

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Run migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 4. Set up reverse proxy (Recommended)

Use Nginx or Traefik to:
- Handle HTTPS/SSL
- Route traffic to containers
- Set up domain names

## Docker Compose Services

### postgres
- PostgreSQL 15 database
- Data persisted in `postgres_data` volume
- Health checks enabled

### backend
- Node.js API server
- Auto-runs migrations on startup
- Hot reload in dev mode
- Production build optimized

### frontend
- Vue.js application
- Vite dev server in dev mode
- Nginx serving static files in production
- SPA routing configured

## Volumes

- `postgres_data`: PostgreSQL database files (persists data)
- `./backend:/app`: Backend code (for hot reload)
- `./frontend:/app`: Frontend code (for hot reload)

## Network

All services are on the same Docker network and can communicate using service names:
- Backend → Database: `postgres:5432`
- Frontend → Backend: `backend:3000`

## Security Notes

1. **Never commit `.env` files** - They contain secrets
2. **Use strong passwords** in production
3. **Change default credentials** before deploying
4. **Use Docker secrets** or environment variable management in production
5. **Enable HTTPS** in production (use reverse proxy)

## Next Steps

1. Start services: `docker-compose up -d`
2. Wait for services to be healthy
3. Access frontend: http://localhost:5173
4. Create an account
5. Start scraping!

