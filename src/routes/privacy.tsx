import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, CONTACT_EMAIL } from "@/components/inboxai/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — InboxAI" },
      { name: "description", content: "How InboxAI handles your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 30, 2026">
      <section>
        <p>
          InboxAI (“we”, “us”) is a Gmail automation product run from Keller, Texas. This policy explains what
          information we collect when you use www.inboxaidfw.com and the InboxAI Gmail agent, how we use it, and the
          choices you have.
        </p>
      </section>

      <section>
        <h2>The short version</h2>
        <ul>
          <li>The InboxAI Gmail agent runs inside <strong>your own Google account</strong>. We never receive the emails it reads.</li>
          <li>We store only what we need to run the service: your sign-in email, your purchase record, and any review you choose to post.</li>
          <li>We do not sell your data, use it for advertising, or use it to train AI models.</li>
        </ul>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Google sign-in:</strong> when you sign in with Google we receive your name, email address, and profile picture so we can confirm your purchase and keep you signed in.</li>
          <li><strong>Purchase records:</strong> when you buy InboxAI, our payment provider (Gumroad or Stripe) sends us your email address, order ID, product, and order details. We never see or store your card number.</li>
          <li><strong>Reviews:</strong> if you post a review, we store the first name, star rating, and text you enter. Reviews are shown publicly on our website.</li>
          <li><strong>Setup form:</strong> the trusted senders, settings, and API key you enter in the setup wizard are used in your browser to build your script. They are not sent to or stored on our servers.</li>
        </ul>
      </section>

      <section>
        <h2>The InboxAI Gmail agent (Basic)</h2>
        <p>
          The agent is a Google Apps Script that you install in your own Google account. It reads, stars, labels,
          trashes, and unsubscribes from your email using your Google account’s own permissions, and it sends
          short excerpts of emails (sender, subject, and a preview) to Google’s Gemini AI using an API key you
          provide. This all happens between your Google account and Google. InboxAI does not receive this data,
          and you can stop the agent at any time by running <code>stopAgent</code> or removing its access at
          myaccount.google.com/permissions.
        </p>
      </section>

      <section>
        <h2>The Priority Dashboard (Premium)</h2>
        <p>
          The Premium Priority Inbox is part of your Gmail agent script and runs as a private web app inside your own
          Google account (only you can open it). To score how important each unread email is, it sends the sender,
          subject, and a short preview to Google’s Gemini AI using your own API key. InboxAI does not receive or store
          your emails or the scores. Our website only remembers your dashboard’s web address in your browser so you
          can open it in one click.
        </p>
        <p>
          InboxAI’s use and transfer of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2>How we use information</h2>
        <ul>
          <li>To verify your purchase and give you access to the setup wizard and dashboard</li>
          <li>To provide, maintain, and fix the service</li>
          <li>To reply when you contact us</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>
          We share information only with the service providers that run InboxAI: Supabase (database and sign-in),
          Vercel (website hosting), Gumroad and Stripe (payments), and Google (sign-in and Gemini AI). We may also
          disclose information if required by law.
        </p>
      </section>

      <section>
        <h2>Keeping and deleting your data</h2>
        <p>
          We keep your purchase record for as long as you have access to InboxAI and as needed for our records. To
          have your account data or a review deleted, email {CONTACT_EMAIL} and we will delete it.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>InboxAI is not directed to children under 13, and we do not knowingly collect information from them.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy, we will update the date at the top of this page.</p>
      </section>
    </LegalPage>
  );
}
