# Stripe Verification Readiness Packet — CorteQS

Last updated: 23 June 2026

This checklist prepares the public website and private Stripe Dashboard inputs for CorteQS Global L.L.C. Keep private identity, tax, and banking records outside this public repository.

## 1. Public website pages added or updated

These pages should be available before requesting live payments:

- Business information: `/legal/business-information`
- Privacy policy: `/legal/privacy`
- Terms of service: `/legal/terms`
- Refund and cancellation policy: `/legal/refund-cancellation`
- Service delivery policy: `/legal/service-delivery`
- Cookie policy: `/legal/cookies`
- Pricing page: `/pricing`
- Contact page: `/iletisim`

The legal pages are bilingual (Turkish primary, English summary) and share the
`LegalLayout` sidebar so every policy is reachable from any legal page. The legacy
`/privacy-policy` path redirects to `/legal/privacy`.

## 2. Stripe Dashboard business profile draft

Use this wording as the business description in Stripe:

> CorteQS is a digital networking, directory, marketplace and community platform for the Turkish diaspora and global communities. The platform offers free basic access for individuals and paid digital subscriptions or visibility tools for consultants, businesses, associations, community managers, bloggers and city ambassadors. Paid services include premium profile features, directory visibility, event/listing tools, campaign tools, boost packages, organization tools and other digital platform services. Services are delivered online through the user account; no physical shipping is involved.

Suggested statement descriptor:

- `CORTEQS`

Suggested support details:

- Website: `https://corteqs.net`
- Support email: `info@corteqs.net`
- Support URL: `https://corteqs.net/iletisim`
- Refund policy URL: `https://corteqs.net/legal/refund-cancellation`
- Terms URL: `https://corteqs.net/legal/terms`
- Privacy URL: `https://corteqs.net/legal/privacy`
- Delivery policy URL: `https://corteqs.net/legal/service-delivery`

Support phone:

- Add a real support phone number in Stripe Dashboard if Stripe requests it. Do not use a placeholder.

## 3. Company information for private Stripe entry

Enter these details inside Stripe Dashboard from the official company documents, not from this repository:

- Legal entity: CorteQS Global L.L.C.
- Entity type: Delaware limited liability company.
- Business structure for US Stripe onboarding: multi-member LLC.
- Registered address: 8 The Green, Ste D, Dover, DE 19901, United States.
- Tax classification from the operating agreement preparation document: partnership / Form 1065.
- Tax ID: enter only from the official tax confirmation document inside Stripe Dashboard.

## 4. Ownership and control information

Based on the operating agreement preparation document, the founder ownership structure is intended as 50/50:

| Person | Role | Ownership | Stripe category |
| --- | --- | ---: | --- |
| Burak Akçakanat | CEO | 50% | Beneficial owner / executive / possible representative |
| Umut Barış Terzioğlu | CTO | 50% | Beneficial owner / executive |

Confirm the final account representative before submitting the Stripe account. The representative should have authority to act for the company and accept Stripe terms.

## 5. Product and pricing evidence

The public `/pricing` page currently shows:

- Consultant Premium Pro: monthly and yearly plan.
- Association / Organization Pro: monthly and yearly plan.
- Business Pro: monthly and yearly plan.
- Free basic access for individuals.
- Free trial messaging.

Before going live, confirm the displayed prices, billing interval, trial language, discount wording and any tax/VAT handling match the Stripe products and prices configured in Dashboard.

## 6. Before submitting to Stripe

- Verify that all public legal links are visible in the footer.
- Confirm that no page contains placeholder company, phone, tax, or refund information.
- Confirm that `https://corteqs.net` resolves correctly and the legal pages are publicly accessible without login.
- Upload sensitive records only through Stripe Dashboard.
- Keep one private folder with company, banking, ownership and authorization records for later review.

## 7. Not legal or tax advice

This packet is an operational readiness checklist. Final wording should be reviewed by a qualified lawyer and accountant, especially because CorteQS Global L.L.C. is a Delaware LLC with cross-border founders and users.
