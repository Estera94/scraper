# SaaS Website Scraper - Setup Guide

## Overview
The application has been successfully converted to a SaaS platform with:
- User authentication (JWT-based)
- Credit-based payment system via Stripe
- PostgreSQL database with Prisma ORM
- Modern Tailwind CSS UI
- Protected routes and API endpoints

## Prerequisites
- Node.js (v20+)
- PostgreSQL database
- Stripe account (for payments)

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE website_scraper;
```

2. Set up environment variables in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/website_scraper?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

3. Run Prisma migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Start Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

## Stripe Webhook Setup

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI: `stripe login`
3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```
4. Copy the webhook secret from the CLI output and add it to `backend/.env` as `STRIPE_WEBHOOK_SECRET`

## Application Features

### Authentication
- User registration at `/signup`
- User login at `/login`
- JWT tokens stored in localStorage
- Protected routes require authentication

### Credit System
- Each website scrape costs 1 credit
- Users must have sufficient credits to scrape
- Credits are deducted after successful scrapes

### Payment Flow
1. User navigates to Dashboard → Purchase Credits
2. Selects a credit package
3. Redirected to Stripe Checkout
4. After payment, webhook adds credits to user account
5. User redirected back to success page

### Credit Packages
- Small Pack: 10 credits for $9.99
- Medium Pack: 50 credits for $39.99
- Large Pack: 100 credits for $69.99

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Scraping
- `POST /api/scrape` - Scrape websites (protected, requires credits)
- `GET /api/results` - Get user's scraping results (protected)
- `DELETE /api/results/:id` - Delete a result (protected)
- `DELETE /api/results` - Delete all results (protected)

### Payments
- `POST /api/payments/create-checkout` - Create Stripe checkout session (protected)
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/history` - Get payment history (protected)
- `GET /api/payments/packages` - Get available credit packages

## Database Schema

### User
- id (String, CUID)
- email (String, unique)
- password (String, hashed)
- credits (Int, default 0)
- createdAt, updatedAt

### Payment
- id (String, CUID)
- userId (String, foreign key)
- stripePaymentId (String, unique)
- amount (Int, in cents)
- credits (Int)
- status (String: pending, completed, failed)
- createdAt

### ScrapeResult
- id (String, CUID)
- userId (String, foreign key)
- website (String)
- results (JSON)
- timestamp

## Next Steps

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Set up Stripe account and get API keys
5. Configure Stripe webhook endpoint
6. Test the application flow:
   - Register a new user
   - Purchase credits
   - Perform scraping
   - View results

## Production Considerations

1. Use strong JWT_SECRET
2. Set up proper CORS for production domain
3. Use environment-specific database URLs
4. Set up Stripe webhook endpoint in Stripe Dashboard
5. Use HTTPS in production
6. Set up proper error logging and monitoring
7. Consider rate limiting for API endpoints
8. Add email verification for user registration
9. Implement password reset functionality
10. Add admin dashboard for managing users and payments


