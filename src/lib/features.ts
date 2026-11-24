// Premium is paused while the Priority Dashboard moves into the customer's own
// Google account (no Gmail access through our servers). Flip to true to sell it again.
export const PREMIUM_ON_SALE = true;

// Stripe's no-code customer portal login link (Stripe Dashboard → Settings →
// Billing → Customer portal). Customers sign in with their email to cancel or
// switch plans. Public by design. Empty = fall back to emailing support.
export const BILLING_PORTAL_URL = "https://billing.stripe.com/p/login/bJe6oHfVTfIyek85BoejK00";
export const MANAGE_SUBSCRIPTION_HREF =
  BILLING_PORTAL_URL || "mailto:inboxaidfw@gmail.com?subject=Manage%20my%20InboxAI%20subscription";
