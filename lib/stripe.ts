import Stripe from "stripe";

// Initialize Stripe with the secret key. We intentionally
// let Stripe use the API version configured on the account
// instead of forcing a hard-coded future version string,
// which was causing session URLs to be missing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
