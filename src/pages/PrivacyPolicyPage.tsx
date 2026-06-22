import { useEffect } from "react";

type MetaState = {
  title: string;
  description: string | null;
  canonical: string | null;
};

const DESCRIPTION =
  "Read CorteQS Privacy Policy to understand how we collect, use, protect, retain, and share personal and payment-related information.";
const CANONICAL_URL = "https://corteqs.net/privacy-policy";

const upsertMetaDescription = (content: string) => {
  let element = document.querySelector('meta[name="description"]');
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", "description");
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const upsertCanonical = (href: string) => {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const getCurrentMetaState = (): MetaState => {
  const descriptionElement = document.querySelector('meta[name="description"]');
  const canonicalElement = document.querySelector('link[rel="canonical"]');

  return {
    title: document.title,
    description: descriptionElement?.getAttribute("content") ?? null,
    canonical: canonicalElement?.getAttribute("href") ?? null,
  };
};

const restoreMetaState = (state: MetaState) => {
  document.title = state.title;

  if (state.description) {
    upsertMetaDescription(state.description);
  }

  if (state.canonical) {
    upsertCanonical(state.canonical);
  }
};

const PrivacyPolicyPage = () => {
  useEffect(() => {
    const previousState = getCurrentMetaState();

    document.title = "Privacy Policy | CorteQS";
    upsertMetaDescription(DESCRIPTION);
    upsertCanonical(CANONICAL_URL);
    document.dispatchEvent(new Event("render-complete"));

    return () => {
      restoreMetaState(previousState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-2 text-3xl font-extrabold text-foreground md:text-5xl">Privacy Policy</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: 22 June 2026</p>

        <article className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">1. Introduction</h2>
            <p>
              CorteQS Global L.L.C. ("CorteQS", "we", "our", "us") respects your privacy and is
              committed to protecting your personal data. This Privacy Policy explains how we collect,
              use, disclose, retain, and protect information when you use our website, platform,
              digital services, profile tools, directory, marketplace features, community channels, and
              payment-related services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">2. Data We Collect</h2>
            <p>We may collect and process the following categories of personal data:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Identity data, such as name, account type, organization name, and role.</li>
              <li>Contact data, such as email address, phone number, WhatsApp number, country, and city.</li>
              <li>Profile and listing data, such as categories, services, business information, public profile content, events, offers, and preferences.</li>
              <li>Account and authentication data, such as login identifiers and account status.</li>
              <li>Payment and billing data, such as subscription plan, invoice status, payment status, billing email, and transaction reference.</li>
              <li>Messages, support requests, WhatsApp communications, and information you provide voluntarily.</li>
              <li>Technical data, such as IP address, browser type, device information, log data, and usage analytics.</li>
            </ul>
            <p className="mt-3">
              We only collect data that is necessary to provide, operate, secure, and improve CorteQS.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">3. Payments and Stripe</h2>
            <p>
              Payments may be processed by Stripe or Stripe-supported payment methods. CorteQS does
              not store full card numbers, card security codes, or full bank account credentials on its
              own servers. Stripe may process payment information, billing details, fraud prevention
              signals, and transaction metadata according to its own terms and privacy practices.
            </p>
            <p className="mt-3">
              We may receive limited payment-related information from Stripe, such as payment status,
              customer identifier, subscription status, invoice reference, last four digits of a card,
              card brand, billing country, or receipt information, where necessary to provide support,
              accounting, fraud prevention, and subscription management.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">4. WhatsApp Usage</h2>
            <p>When you contact us via WhatsApp:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Your phone number and messages are processed to provide support and services.</li>
              <li>Communication may be handled via WhatsApp Business tools provided by Meta Platforms, Inc.</li>
              <li>By initiating a conversation, you consent to being contacted via WhatsApp for that request.</li>
            </ul>
            <p className="mt-3">
              We do not sell or share your WhatsApp data with third parties for unrelated marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">5. Purposes of Processing</h2>
            <p>Your data is used for:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Providing access to CorteQS platform features.</li>
              <li>Managing registrations, profiles, listings, subscriptions, payments, invoices, and support.</li>
              <li>Processing digital service delivery, account activation, and premium feature access.</li>
              <li>Communicating about your account, payments, support requests, and service updates.</li>
              <li>Improving platform security, preventing fraud, abuse, spam, and unauthorized activity.</li>
              <li>Complying with legal, tax, accounting, regulatory, and dispute-resolution obligations.</li>
              <li>Operating referral, contributor, community, and marketplace programs where applicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">6. Legal Basis (GDPR)</h2>
            <p>Where GDPR applies, we process personal data based on:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Your consent (Art. 6(1)(a) GDPR).</li>
              <li>Contractual necessity (Art. 6(1)(b) GDPR).</li>
              <li>Legal obligations (Art. 6(1)(c) GDPR).</li>
              <li>Legitimate interests such as platform security, fraud prevention, support, analytics, and service improvement (Art. 6(1)(f) GDPR).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">7. Data Sharing</h2>
            <p>We do not sell your personal data.</p>
            <p className="mt-3">We may share data only with:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Service providers necessary for hosting, database, analytics, communication, support, email, and platform operation.</li>
              <li>Payment processors such as Stripe for payment processing, billing, subscriptions, receipts, fraud prevention, disputes, and compliance.</li>
              <li>Professional advisors such as accountants, lawyers, auditors, and tax advisors where necessary.</li>
              <li>Legal authorities, regulators, courts, banks, or payment networks when required by law or dispute processes.</li>
              <li>Other users only where you choose to publish profile, listing, event, business, or community information.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">8. International Transfers</h2>
            <p>
              CorteQS operates globally. Personal data may be processed in countries outside your
              country of residence, including the United States and countries where our service
              providers operate. Where required, we use appropriate safeguards such as contractual
              protections and data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">9. Data Retention</h2>
            <p>We retain your data only as long as necessary for:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Service delivery and account management.</li>
              <li>Subscription, billing, accounting, tax, and legal retention obligations.</li>
              <li>Security, fraud prevention, dispute handling, and audit purposes.</li>
            </ul>
            <p className="mt-3">You may request deletion where applicable legal conditions are met.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">10. User Rights (GDPR)</h2>
            <p>Where applicable, you have the right to:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Access your personal data.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion.</li>
              <li>Restrict or object to processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
              <li>Lodge a complaint with a competent data protection authority.</li>
            </ul>
            <p className="mt-3">To exercise your rights, contact us below.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">11. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data
              against unauthorized access, loss, misuse, alteration, or disclosure. No online platform
              can guarantee absolute security, but we work to keep data protected and access limited.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">12. Contact</h2>
            <p>For privacy-related questions or requests:</p>
            <p className="mt-3">
              CorteQS Global L.L.C.<br />
              8 The Green, Ste D, Dover, DE 19901, United States<br />
              Email: <a href="mailto:info@corteqs.net">info@corteqs.net</a><br />
              Website: <a href="https://corteqs.net">https://corteqs.net</a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">13. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Updates will be published on this page.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
