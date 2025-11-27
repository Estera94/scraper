import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scrapeRoutes from './routes/scrape.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payments.js';
import { config } from './config.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());

// Stripe webhook needs raw body, so handle it before json middleware
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes);

// JSON middleware for all other routes
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', scrapeRoutes);

// Debug route to check registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  scrapeRoutes.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    }
  });
  res.json({ routes, message: 'Registered routes on scrape router' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

