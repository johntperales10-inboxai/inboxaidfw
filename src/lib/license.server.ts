import { createHmac, timingSafeEqual } from "crypto";

// License keys let a customer's Apps Script ask "is this email still subscribed?"
// without anyone being able to look up other people's emails. The key is an HMAC
// of the email, so it can't be guessed without LICENSE_SECRET (a Vercel env var).
// Read process.env inside functions: env binds per request on some hosts.

export function licenseKeyFor(email: string): string | null {
  const secret = process.env.LICENSE_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 32);
}

export function isValidLicenseKey(email: string, key: string): boolean {
  const expected = licenseKeyFor(email);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
