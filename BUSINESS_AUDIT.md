# Phoenix business audit
Evidence date: September 9, 2026, America/Chicago. Status: code prepared and tested in isolation; existing ad budget reduced with approval; no new campaign launch or deployment.

## Verified facts
The primary repository is Phoenix/Phoenix-Business, not its parent folder. All three inspected repositories had no tracked changes at the initial check. They use Angular 21, Express, and Mongoose. Local Vercel files link all three to the same team. The sales project is named green-grass-tier3 in Vercel. Its latest deployment was reported READY for production. This does not prove every local file matches that deployment.
The live Phoenix homepage matches the inspected hero, form, and demo content. It has separate website and data sales offers. It links to the personal portfolio in navigation and the footer. The owner signed into outreach and Google Ads during the session. The correct Ads account uses hello@phoenixwebsites.ai. Gmail and Vercel read access work.

## Baseline defects and priority
1. Critical: backend/routes/leads.js drops the submitted message, then sends an unrelated AI/SaaS guide. The requested audit is not fulfilled. Fix prepared: save an AuditRequest, notify the owner, and remove the unrelated recipient email.
2. Critical: test-outreach can send through a public route. Review admin comments check only whether a person is signed in. Fix prepared: fail-closed owner ID guard. Existing owner ID must be configured before owner tools work.
3. High: inbound leads enter a shared pending outreach collection. The existing outreach worker selects pending leads. Fix prepared: separate inbound requests from automatic prospect sequences.
4. High: service metadata advertises old $99/$149 prices, and structured data contains $350/$99/$149. The visible service code has different prices and dynamic API pricing. Remove stale numeric search claims.
5. High: no analytics tags found in frontend/src. A new dataLayer event is an integration point, not a configured analytics property.
6. High: home form labels lack explicit input associations. Errors use an alert. Fix prepared: associated labels, inline errors, durable success message, field bounds, duplicate-click guard.
7. Medium: three demonstration websites load in iframes. Fix prepared: lazy loading, accessible titles, direct links, and explicit demo labels. No client outcomes are claimed.
8. Medium: cold inbox allows a stale response after filters change and leaves a refresh timer alive after view destruction. Fix prepared: cancel old requests and clear the timer.
9. High: contract copy combines a 30-day subscription trial with a mandatory 12-month commitment and non-refundable setup. A returned user can reach checkout with acceptedContract hardcoded true. These need explicit per-order review and legal review. No obligations changed.
10. Medium: competing top-level Data, AI call, cart, portfolio, and service actions divide buyer attention. Start with a free website audit as the main action; keep pricing secondary. Keep founder proof in the footer/about section.

## Performance baseline
Three sequential public GETs per URL from this computer. Seconds below are total response time, not full mobile render time.
- Phoenix /api/health: 2.088, 0.282, 0.224. All HTTP 200.
- Outreach /api/v1/health: 1.798, 0.267, 0.258. All HTTP 200.
- Outreach /: 0.263, 0.194, 0.175. All HTTP 200; 23,629 response bytes each.
The slower first API responses are consistent with startup overhead. This small sample does not isolate database or external-service delay. Authenticated inbox timing is blocked by sign-in. Do not call the dashboard fast based on these results. No before/after production claim is made because changes are not deployed.

## Delivery workflow
Phoenix/new-project.py scaffolds Angular, Express, MongoDB, styles, authentication choices, and dependency installation. It defaults several animation libraries on. Scaffold generation is not project completion. No reliable time logs, revisions, support hours, hosting invoices, or completed project margin records were available. For simple lead sites choose no physics, confetti, or 3D unless the brief needs them. Time the next three jobs: setup, content, build, tests, revisions, and support.

## Upwork evidence
The September 9 support notice for “Marketing Content Creator Needed” says the post appeared to involve deceptive marketing. It lists fake reviews and fake followers as prohibited examples. Those examples do not prove the original post requested them. The original post was not found in the targeted mailbox search. Exact triggering wording remains unknown. The notice asks the owner to review the account banner. The agent has not accepted terms or reposted the job. Private support ticket: https://support.upwork.com/hc/requests/55496745 .

## Unknowns
Historical traffic, spend, leads, qualified calls, revenue, gross margin, active client obligations, sender DNS, delivery reports, Google Ads search terms and conversion actions, and Search Console coverage remain unknown. They are not zero. Account data must establish the baseline before launch.

## Account findings after sign-in
Google Ads “Custom Website Design” is Performance Max, not Search. It began September 9. The account overview for its all-time period (September 9 only) showed zero impressions, zero clicks, and $0 cost; reporting is delayed. The campaign is learning and has poor ad strength. It targets the United States. No historical waste conclusion is justified.
The owner authorized reducing its $20/day budget to about $200/month. Saved and verified: $6.57/day. Existing campaign stays enabled. No replacement campaign was published.
Only one conversion action was visible: Subscribe, GA4 event ads_conversion_Subscribe_1, triggered by page load /leave-review, Primary, Every, 90-day click window, default $1 fallback value. The owner confirmed that this page follows tier purchase. Code confirms checkout returns to /dashboard?success=true, then the review popup routes eligible buyers to /leave-review. It is therefore a purchase proxy. Customers can also revisit the page from dashboard and review links. A page-load trigger with Every counting does not by itself prove a new paid transaction or deduplicate purchases. Verify payment-linked events before relying on this for purchase bidding. The GA4 property is named phoenixwebsites.ai. End-to-end collection remains unverified.
After authentication, outreach showed RUNNING, 10 active streams, network reach 1,777, and 0% success velocity. These app labels are not audited counts of leads or clients. The inbox showed 34 messages, split 31/3 between the portfolio and business senders. No new engine was activated by the agent.
The owner clarified that “slow” means slow client acquisition, not application performance. Keep further work focused on targeting and reply quality. The isolated inbox correctness fixes remain useful but do not establish faster sales.
Critical login defect: auth.js signs the full config into JWTs and puts the token in a query URL. The config includes credentials. Prepared mitigation removes config from newly issued tokens, avoids OAuth query logging, and uses a URL fragment. Existing exposed credentials and old tokens still need owner rotation/invalidation after the fix. A fragment alone does not replace a secure session design. No secret values are retained in these documents.
Public DNS returned SPF include:zohomail.com for phoenixwebsites.ai. No DMARC TXT value was returned by the query. DKIM selector and received-mail alignment remain unverified. Local Stripe key is live, so no payment test was run.


## Confirmed data offer and automation — September 10
The owner clarified that Phoenix cleans and organizes client-provided files using Microsoft tools and AI. It does not currently sell data lists or public-record blocks. This supersedes earlier offer assumptions. A quote-based data-cleanup page, services card, and request flow are implemented locally. New legacy data purchases are blocked locally; the old data entry page redirects to cleanup. Production rollout remains pending. A daily 9 a.m. Central operations heartbeat is active; it performs monitoring and authorized preparation, not unapproved sending, purchasing, or deployment. See the session outputs/CURRENT_STATUS.md for the current blockers and verification limits.
