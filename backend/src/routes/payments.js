import express from 'express';
import Stripe from 'stripe';
import prisma from '../db/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Credit packages configuration
const CREDIT_PACKAGES = [
  { id: 'small', name: 'Small Pack', credits: 10, price: 999 }, // $9.99
  { id: 'medium', name: 'Medium Pack', credits: 50, price: 3999 }, // $39.99
  { id: 'large', name: 'Large Pack', credits: 100, price: 6999 }, // $69.99
];

// Create Stripe checkout session
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const { packageId } = req.body;

    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }

    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} scraping credits`,
            },
            unit_amount: creditPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
      client_reference_id: req.user.id,
      metadata: {
        userId: req.user.id,
        credits: creditPackage.credits.toString(),
        packageId: packageId,
      },
    });

    // Create payment record in database
    await prisma.payment.create({
      data: {
        userId: req.user.id,
        stripePaymentId: session.id,
        amount: creditPackage.price,
        credits: creditPackage.credits,
        status: 'pending',
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler (raw body is handled in server.js)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Find payment record
      const payment = await prisma.payment.findUnique({
        where: { stripePaymentId: session.id },
        include: { user: true },
      });

      if (payment && payment.status === 'pending') {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' },
        });

        // Add credits to user
        const credits = parseInt(session.metadata.credits || payment.credits.toString());
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            credits: {
              increment: credits,
            },
          },
        });

        console.log(`Added ${credits} credits to user ${payment.userId}`);
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }

  res.json({ received: true });
});

// Get payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        credits: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// Get available credit packages
router.get('/packages', (req, res) => {
  res.json({
    packages: CREDIT_PACKAGES.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      priceFormatted: `$${(pkg.price / 100).toFixed(2)}`,
    })),
  });
});

export default router;

