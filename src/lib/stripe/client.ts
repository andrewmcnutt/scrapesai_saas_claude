import Stripe from 'stripe';

// Lazy-initialize Stripe client to prevent build failures when STRIPE_SECRET_KEY
// is not set in the environment. The client is created on first use at runtime,
// not at module load time — this allows `next build` to succeed without Stripe keys.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience export for backward compatibility — same lazy initialization
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
