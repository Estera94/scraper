# Quick Start Guide

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Set Up Database

### Option A: Using PostgreSQL (Recommended)

1. **Install PostgreSQL** (if not already installed):
   - macOS: `brew install postgresql@14` or download from https://www.postgresql.org/download/
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)
   - Windows: Download from https://www.postgresql.org/download/windows/

2. **Create database**:
```bash
# Start PostgreSQL service (if needed)
# macOS: brew services start postgresql@14
# Linux: sudo systemctl start postgresql

# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE website_scraper;

# Create user (optional, or use existing user)
CREATE USER scraper_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE website_scraper TO scraper_user;

# Exit psql
\q
```

3. **Create `.env` file in `backend/` directory**:
```bash
cd backend
touch .env
```

4. **Add to `backend/.env`**:
```env
DATABASE_URL="postgresql://scraper_user:your_password@localhost:5432/website_scraper?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-to-something-random"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

5. **Run database migrations**:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Option B: Quick Test (Skip Database for Now)

If you just want to test the frontend without database:
- You can skip database setup, but authentication and scraping won't work
- The app will show errors when trying to login/register

## Step 3: Set Up Stripe (Optional for Testing)

For payment features to work:

1. **Create Stripe account**: https://stripe.com
2. **Get test API keys** from Stripe Dashboard → Developers → API keys
3. **Add keys to `backend/.env`**:
   - `STRIPE_SECRET_KEY`: Your test secret key (starts with `sk_test_`)
   - `STRIPE_PUBLISHABLE_KEY`: Your test publishable key (starts with `pk_test_`)

4. **For webhooks (local development)**:
```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks (run in separate terminal)
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy the webhook secret (starts with whsec_) and add to .env
```

**Note**: You can test the app without Stripe, but payment features won't work.

## Step 4: Run the Application

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
Server running on http://localhost:3000
```

### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Terminal 3 - Stripe Webhook (Optional, only if using payments)
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## Step 5: Access the Application

1. Open your browser: http://localhost:5173
2. You'll be redirected to `/login`
3. Click "Don't have an account? Sign up" to create an account
4. After registration, you'll be logged in automatically

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` in `.env` matches your PostgreSQL setup
- Verify database exists: `psql -l` should show `website_scraper`

### Port Already in Use
- Backend (3000): Change `PORT=3001` in `.env` and update `FRONTEND_URL` in frontend API calls
- Frontend (5173): Vite will automatically use next available port

### Prisma Errors
```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# Or create fresh migration
npx prisma migrate dev
npx prisma generate
```

### Module Not Found Errors
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

## Quick Test Without Database

If you want to just see the UI without setting up database:

1. Start frontend: `cd frontend && npm run dev`
2. Open http://localhost:5173
3. You'll see login page, but registration/login won't work without backend

## Next Steps

Once running:
1. ✅ Create an account at `/signup`
2. ✅ Login at `/login`
3. ✅ Go to Dashboard to see credit balance (starts at 0)
4. ✅ Purchase credits (requires Stripe setup)
5. ✅ Start scraping websites
6. ✅ View results

## Need Help?

- Check `SETUP.md` for detailed information
- Verify all environment variables are set
- Check terminal output for error messages
- Ensure PostgreSQL is running and accessible

