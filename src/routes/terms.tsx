import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, CONTACT_EMAIL } from "@/components/inboxai/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — InboxAI" },
      { name: "description", content: "The terms for using InboxAI." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="September 30, 2026">
      <section>
        <p>
          These terms apply to your use of www.inboxaidfw.com and the InboxAI Gmail agent (“InboxAI”). By buying or
          using InboxAI you agree to them. Our{" "}
          <Link to="/privacy">Privacy Policy</Link> explains how we handle your data.
        </p>
      </section>

      <section>
        <h2>What you get</h2>
        <p>
          A one-time purchase gives you a personal, non-transferable license to use InboxAI for your own Gmail
          account(s): the setup wizard, your generated Gmail agent script, and, for Premium, the Priority Dashboard.
          There is no subscription and no recurring charge.
        </p>
      </section>

      <section>
        <h2>Your responsibilities</h2>
        <ul>
          <li>You install and run the agent in your own Google account, and you’re responsible for the settings you choose.</li>
          <li>You provide your own Google Gemini API key and are responsible for any charges from Google for its use.</li>
          <li>Don’t resell, share, or redistribute InboxAI or your generated script, and don’t use InboxAI for spam or anything unlawful.</li>
        </ul>
      </section>

      <section>
        <h2>How the agent behaves</h2>
        <p>
          InboxAI uses AI to decide what to do with emails, and AI can make mistakes. The agent moves emails to
          Gmail’s trash rather than deleting them permanently (Gmail keeps trash for 30 days), and it asks you when
          it isn’t sure. Please check your trash and starred emails from time to time, especially at first. You can
          stop the agent at any time by running <code>stopAgent</code> or removing its access at
          myaccount.google.com/permissions.
        </p>
      </section>

      <section>
        <h2>Payments and refunds</h2>
        <p>
          Purchases are processed by Gumroad or Stripe. If InboxAI isn’t working for you, email {CONTACT_EMAIL} and
          we’ll try to fix it. Refund requests are handled by email.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          InboxAI is provided “as is.” We work hard to keep it reliable, but we don’t guarantee it will be
          error-free or uninterrupted, or that it will catch or correctly handle every email.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the extent the law allows, InboxAI is not liable for indirect or consequential losses, including missed
          or trashed emails, and our total liability is limited to the amount you paid for InboxAI.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          We may update these terms; the date at the top shows the latest version. These terms are governed by the
          laws of the State of Texas. Questions: {CONTACT_EMAIL}.
        </p>
      </section>
    </LegalPage>
  );
}
