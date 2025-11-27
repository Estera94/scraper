# Website Scraper SaaS

A modern SaaS application for scraping website information (LinkedIn, Email, Twitter, Phone, WHMCS) with user authentication, credit-based payments via Stripe, and a clean Tailwind CSS UI.

## Features

- 🔐 User authentication (JWT-based)
- 💳 Credit-based payment system (Stripe)
- 🗄️ PostgreSQL database with Prisma ORM
- 🎨 Modern Tailwind CSS UI
- 🐳 Docker support
- 🔒 Protected routes and API endpoints

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)

### 1. Start the application

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

### 3. Set up environment variables (optional)

Create a `.env` file in the project root for custom configuration:

```env
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### 4. Stop the application

```bash
docker-compose down
```

**That's it!** The database will be automatically set up with migrations.

## Manual Setup (Without Docker)

See [QUICKSTART.md](./QUICKSTART.md) for detailed manual setup instructions.

## Documentation

- **[DOCKER.md](./DOCKER.md)** - Complete Docker guide
- **[QUICKSTART.md](./QUICKSTART.md)** - Manual setup guide
- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration

## Project Structure

```
website-scraper/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   └── middleware/ # Auth middleware
│   └── prisma/       # Database schema
├── frontend/         # Vue.js frontend
│   └── src/
│       ├── components/
│       ├── views/
│       └── services/
└── docker-compose.yml # Docker configuration
```

## Development

### With Docker

```bash
# Start in development mode (hot reload)
docker-compose up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after dependency changes
docker-compose up -d --build
```

### Without Docker

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Production

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/scrape` - Scrape websites (requires credits)
- `GET /api/results` - Get scraping results
- `POST /api/payments/create-checkout` - Create payment session
- `GET /api/payments/packages` - Get credit packages

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL, JWT, Stripe
- **Frontend**: Vue 3, Vue Router, Tailwind CSS, Axios
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose

## License

ISC
