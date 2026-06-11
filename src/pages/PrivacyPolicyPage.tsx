import { useEffect } from "react";

type MetaState = {
  title: string;
  description: string | null;
  canonical: string | null;
};

const DESCRIPTION =
  "Read CorteQS Privacy Policy to understand how we collect, use, protect, and retain personal information.";
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

    document.title = "Privacy Policy | Corteqs";
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
        <h1 className="mb-8 text-3xl font-extrabold text-foreground md:text-5xl">Privacy Policy</h1>

        <article className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">1. Introduction</h2>
            <p>
              Corteqs ("we", "our", "us") respects your privacy and is committed to protecting your personal
              data. This Privacy Policy explains how we collect, use, and protect your information when you
              use our platform, including our website and WhatsApp communication channels.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">2. Data Collection</h2>
            <p>
              We may collect and process the following types of personal data:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Full name</li>
              <li>Phone number (including WhatsApp number)</li>
              <li>Location information (country, city)</li>
              <li>User preferences and selected categories</li>
              <li>Messages and information you provide voluntarily</li>
              <li>Technical data (IP address, browser type, device info)</li>
            </ul>
            <p className="mt-3">
              We only collect data that is necessary to provide and improve our services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">3. WhatsApp Usage</h2>
            <p>When you contact us via WhatsApp:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Your phone number and messages are processed to provide support and services</li>
              <li>
                Communication is handled via WhatsApp Business API (provided by Meta Platforms, Inc.)
              </li>
              <li>By initiating a conversation, you consent to being contacted via WhatsApp</li>
            </ul>
            <p className="mt-3">
              We do not sell or share your WhatsApp data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">4. Purpose of Data Processing</h2>
            <p>Your data is used for:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Providing access to Corteqs platform features</li>
              <li>Managing user registrations and profiles</li>
              <li>Communication and support</li>
              <li>Improving our services and user experience</li>
              <li>Referral and community programs (if applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">5. Legal Basis (GDPR)</h2>
            <p>We process your data based on:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Your consent (Art. 6(1)(a) GDPR)</li>
              <li>Contractual necessity (Art. 6(1)(b) GDPR)</li>
              <li>Legitimate interest (Art. 6(1)(f) GDPR)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">6. Data Sharing</h2>
            <p>We do not sell your personal data.</p>
            <p className="mt-3">We may share data only with:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Service providers necessary for platform operation</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">7. Data Retention</h2>
            <p>
              We retain your data only as long as necessary for:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Service delivery</li>
              <li>Legal and regulatory requirements</li>
            </ul>
            <p className="mt-3">You may request deletion at any time.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">8. User Rights (GDPR)</h2>
            <p>You have the right to:</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion ("Right to be forgotten")</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">To exercise your rights, contact us below.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">9. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data against
              unauthorized access, loss, or misuse.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">10. Contact</h2>
            <p>For any privacy-related questions or requests:</p>
            <p className="mt-3">📧 Email: info@corteqs.net</p>
            <p>🌐 Website: https://corteqs.net</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-foreground">11. Updates to This Policy</h2>
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
