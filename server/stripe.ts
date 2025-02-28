import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-02-15', // Use the latest stable API version
  typescript: true,
});

// Helper function to format amount for Stripe (converts dollars to cents)
export const formatAmountForStripe = (amount: number, currency: string): number => {
  const currencies = ['USD', 'EUR', 'GBP'];
  const currencyMultiplier = currencies.includes(currency.toUpperCase()) ? 100 : 1;
  return Math.round(amount * currencyMultiplier);
};

// Helper function to handle Stripe errors
export const handleStripeError = (error: any): { status: number; message: string; code: string } => {
  if (error instanceof Stripe.errors.StripeError) {
    // Handle specific Stripe errors
    switch (error.type) {
      case 'StripeCardError':
        return { status: 402, message: error.message, code: 'CARD_ERROR' };
      case 'StripeInvalidRequestError':
        return { status: 400, message: error.message, code: 'INVALID_REQUEST' };
      case 'StripeAuthenticationError':
        return { status: 401, message: 'Authentication with Stripe failed', code: 'AUTH_ERROR' };
      default:
        return { status: 500, message: 'An error occurred with our payment processor', code: 'STRIPE_ERROR' };
    }
  }
  // Handle non-Stripe errors
  return { status: 500, message: 'An unexpected error occurred', code: 'SERVER_ERROR' };
};