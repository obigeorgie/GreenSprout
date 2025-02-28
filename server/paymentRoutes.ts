import { Router } from 'express';
import { stripe, formatAmountForStripe, handleStripeError } from './stripe';
import { storage } from './storage';
import { insertPaymentSchema, insertSubscriptionSchema } from '@shared/schema';
import type { Request, Response } from 'express';
import csrf from 'csurf';

const router = Router();
const csrfProtection = csrf({ cookie: true });

// Create a payment intent for one-time payments
router.post('/create-payment-intent', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, currency),
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    const { status, message, code } = handleStripeError(error);
    res.status(status).json({ error: message, code });
  }
});

// Create a subscription
router.post('/create-subscription', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { userId, planId, paymentMethodId } = req.body;

    // Get the subscription plan
    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      return res.status(404).json({
        error: 'Subscription plan not found',
        code: 'PLAN_NOT_FOUND'
      });
    }

    // Create or get customer
    let customer = await stripe.customers.list({ email: userId, limit: 1 });
    let customerId: string;

    if (customer.data.length > 0) {
      customerId = customer.data[0].id;
      // Attach the payment method to the existing customer
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email: userId,
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      customerId = newCustomer.id;
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in our database
    await storage.createSubscription({
      userId,
      planId,
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
    });
  } catch (error) {
    const { status, message, code } = handleStripeError(error);
    res.status(status).json({ error: message, code });
  }
});

// Cancel subscription
router.post('/cancel-subscription', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await storage.getSubscriptionByStripeId(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        code: 'NOT_FOUND'
      });
    }

    // Cancel the subscription at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update our database
    await storage.updateSubscription(subscription.id, {
      cancelAtPeriodEnd: true,
    });

    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    const { status, message, code } = handleStripeError(error);
    res.status(status).json({ error: message, code });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({
      error: 'Webhook secret not configured',
      code: 'WEBHOOK_SECRET_MISSING'
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      webhookSecret
    );

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await storage.updateSubscriptionByStripeId(invoice.subscription as string, {
            status: 'active',
          });
        }
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          await storage.updateSubscriptionByStripeId(failedInvoice.subscription as string, {
            status: 'past_due',
          });
        }
        break;
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await storage.updateSubscriptionByStripeId(subscription.id, {
          status: 'canceled',
        });
        break;
    }

    res.json({ received: true });
  } catch (error) {
    const { status, message, code } = handleStripeError(error);
    res.status(status).json({ error: message, code });
  }
});

export default router;
