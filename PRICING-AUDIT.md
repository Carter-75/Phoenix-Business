# Phoenix Websites AI — Unified Pricing Architecture & Service Offering Audit

**Document:** `PRICING-AUDIT.md`  
**Repository:** Phoenix Websites AI (`https://phoenixwebsites.ai/`)  
**Pass:** Third-Pass Architectural Overhaul  
**Lead Engineer & Founder:** Carter Moyer  
**Status:** Authoritatively Implemented & Verified (37 Backend Tests Passing, 12 Frontend Tests Passing)

---

## 1. Executive Summary: Elimination of Parallel Systems into ONE Unified Purchasing Path

In previous iterations, the website suffered from customer-facing confusion:
- **System A:** Legacy "Managed Growth Plans" (fixed 4-tier cards with bundled hours).
- **System B:** Project Configurator (modular one-time build fees with optional hosting).

### The Solution in Pass 3:
Phoenix Websites AI now operates **ONE unified, authoritative purchase system**:
1. **The Canonical Funnel:**
   - **Step 1:** Customer selects a Base Tier (`starter`, `business`, `ecommerce`, `webapp`, `enterprise`).
   - **Step 2:** Customer sees BOTH its One-Time Setup Fee (covering architecture, engineering, scaffolding, deployment) AND its Monthly Fee (covering cloud infrastructure, hosting, monitoring, and ongoing support).
   - **Step 3:** Customer configures project scope (number of pages, turnaround schedule).
   - **Step 4:** Customer selects modular Add-Ons categorized by domain (`development`, `ai`, `design`, `marketing`, `operations`) with explicit billing tags (`ONE_TIME`, `MONTHLY`, `BOTH`).
   - **Step 5:** The system automatically calculates progressive Add-On Bundle Savings (5%, 10%, 15%) in real time.
   - **Step 6:** The active Global Seasonal Promotion applies consistently across **BOTH** the setup subtotal and monthly subtotal.
   - **Step 7:** Customer can apply an optional database-backed coupon code.
   - **Step 8:** The UI presents clear, transparent side-by-side pricing (Genuine Struck-Through Reference Price vs. Discounted Active Sale Price).
   - **Step 9:** Clear pre-checkout commitment disclosure:
     - `DUE TODAY: $X`
     - `FIRST MONTHLY PAYMENT: $Y on [Date exactly +30 days]`
     - `THEN: $Y/month (Mandatory 12-Month Agreement)`
   - **Step 10:** Authoritative server-side Stripe Checkout creates the initial setup charge and schedules the monthly subscription with `trial_period_days: 30`, storing an immutable `OrderSnapshot` in MongoDB.

---

## 2. Every Base Tier: Two Price Components & Contract Terms

Every main tier in the unified system features both setup and recurring components:

| Tier ID | Display Title | Normal Setup Fee (Due Today) | Normal Monthly Fee | Commitment | Delivery Timeline | Inclusions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `starter` | **Starter Launch Website** | **$1,499** | **$99/mo** | 12 Months | 2 Weeks Max | Custom 1–3 page website, mobile & responsive design, contact forms, edge cloud deployment, uptime monitoring, 30-day billing trial. |
| `business` | **Custom Business Website** | **$2,499** | **$199/mo** | 12 Months | 3 Weeks Max | Everything in Starter + up to 6 custom pages, service showcase galleries, team/portfolio grids, lead automation, 2 hrs/mo content updates. |
| `ecommerce` | **E-Commerce Storefront** | **$3,499** | **$299/mo** | 12 Months | 4 Weeks Max | Everything in Business + up to 8 pages, product catalog, cart state, integrated Stripe payment workflows, automated order confirmation receipts. |
| `webapp` | **Full-Stack Web App / SaaS MVP**| **$4,999** | **$399/mo** | 12 Months | 5 Weeks Max | Everything in Business + up to 10 pages, custom authentication, database schema (Mongo/Postgres), authenticated client portal, admin dashboard. |
| `enterprise` | **Enterprise Custom Platform** | **$14,999** | **$999/mo** | 12 Months | Milestone Scope | Everything in Web App + up to 15 pages, multi-role granular permissions, high-concurrency database, dedicated account SLAs, 10+ hrs/mo custom engineering. |

*(Compatibility Note: Legacy aliases `simple` $\rightarrow$ `starter`, `essential` $\rightarrow$ `business`, and `professional` $\rightarrow$ `ecommerce` are seamlessly mapped by the backend to guarantee zero breaking changes for existing customers or historical Stripe subscriptions).*

---

## 3. Comprehensive Add-On Catalog & Billing Classification

Every add-on in the catalog explicitly defines its commercial billing classification:
- `ONE_TIME`: Development and initial implementation only.
- `MONTHLY`: Ongoing service, monitoring, or retainer hours.
- `BOTH`: Initial setup/integration fee PLUS recurring monthly infrastructure/maintenance.

| Add-On ID | Category | Add-On Name | Billing Type | Setup Fee (Normal) | Monthly Fee (Normal) | Description & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `database` | Development | Managed Database & Custom CRUD | `BOTH` | $800 | $40/mo | Dedicated MongoDB/Postgres schema, data validation, and custom database records management. |
| `auth` | Development | User Authentication & Profiles | `BOTH` | $600 | $30/mo | Secure registration, email/password & Google OAuth login, user profile storage, password reset. |
| `roles` | Development | Multi-Role User Permissions | `ONE_TIME` | $450 | $0/mo | Granular access control (admin, manager, member, client) with secure role-based guards. |
| `dashboard` | Development | Custom Admin / Client Portal | `BOTH` | $1,200 | $60/mo | Private administrative dashboard with metrics, user/order tables, and operational management. |
| `payments` | Development | Stripe Payments & Checkout | `BOTH` | $500 | $35/mo | Integrated Stripe checkout, customer billing portal, webhook receipts, and transaction handling. |
| `ecommerce` | Development | E-Commerce Product Catalog & Cart | `BOTH` | $750 | $45/mo | Dynamic product catalog, inventory tracking, cart state, order notifications, and discount codes. |
| `booking` | Development | Booking & Scheduling System | `BOTH` | $550 | $25/mo | Interactive appointment scheduling, calendar synchronization, automated email/SMS reminders. |
| `file_storage` | Development | Secure Document & File Storage | `BOTH` | $400 | $20/mo | Encrypted cloud storage uploads (S3/GCS) with virus scanning and secure presigned URLs. |
| `realtime` | Development | Realtime WebSockets / Live Chat | `BOTH` | $750 | $45/mo | Instant bi-directional messaging, live collaboration, or real-time event streaming. |
| `api_integrations` | Development | Third-Party API & Webhooks | `ONE_TIME` | $600 | $0/mo | Sync with external CRMs (HubSpot, Salesforce), email platforms, custom webhooks, or ERPs. |
| `sms_notifications`| Development | Transactional SMS Alerts Gateway | `BOTH` | $350 | $20/mo | Instant customer and admin SMS notifications via Twilio or Telnyx. |
| `cms` | Development | Headless CMS Content Management | `BOTH` | $700 | $35/mo | Visual content editor interface (Sanity, Strapi) allowing non-technical staff to publish blog/copy. |
| `multilingual` | Development | Multilingual Internationalization| `ONE_TIME` | $500 | $0/mo | Multi-language routing, translation state management, and hreflang international SEO tags. |
| `migration` | Development | Legacy Website & Data Migration | `ONE_TIME` | $650 | $0/mo | Full content extraction, 301 redirect map creation, asset transfer, and zero-downtime cutover. |
| `ai_assistant` | AI | Grounded Business AI Assistant | `BOTH` | $900 | $50/mo | 24/7 web assistant trained exclusively on your business facts with strict guardrails and lead capture. |
| `rag_knowledge` | AI | RAG Knowledge-Base Assistant | `BOTH` | $1,400 | $75/mo | Semantic vector search over PDFs, manuals, and documents with citations and factual retrieval. |
| `ai_voice` | AI | 24/7 Web Voice Assistant (WebRTC) | `BOTH` | $1,100 | $60/mo | Ultra-low latency spoken voice interaction directly in the client browser for lead intake. |
| `premium_design`| Design | Bespoke 3D & GSAP Motion Design | `ONE_TIME` | $750 | $0/mo | Interactive WebGL canvas shaders, scroll-driven GSAP sequences, and bespoke brand micro-animations. |
| `branding` | Design | Brand Identity & Vector Asset Kit | `ONE_TIME` | $500 | $0/mo | Primary/secondary logo vectors, typography scale, responsive favicon suite, and brand style tokens. |
| `seo_package` | Marketing | Advanced Technical SEO & Schema | `BOTH` | $450 | $30/mo | Deep structured data JSON-LD graphs, breadcrumb navigation, sitemap configuration, and GEO/AEO optimization. |
| `geo_aeo` | Marketing | GEO & AI Search Engine Optim. | `ONE_TIME` | $500 | $0/mo | Optimization for Perplexity, ChatGPT Search, and Google AI Overviews with structured factual citations. |
| `copywriting` | Marketing | Professional Copywriting & Messaging| `ONE_TIME` | $350 | $0/mo | Conversion-oriented value propositions, clear service breakdowns, and customer trust copy. |
| `priority_sla` | Operations | 24/7 Priority Emergency Support | `MONTHLY` | $0 | $150/mo | Guaranteed under-2-hour emergency response window, direct phone escalation, and weekend coverage. |
| `extra_support_hours`| Operations | Extended Engineering Retainer | `MONTHLY` | $0 | $350/mo | Additional 5 dedicated hours per month of custom feature development, design updates, or integrations. |
| `security_audit` | Operations | Enterprise Security & Hardening | `BOTH` | $650 | $50/mo | Automated vulnerability scans, OWASP audit, DDoS mitigation via Cloudflare, and quarterly penetration tests. |

---

## 4. Legitimate Data-Driven Dynamic Pricing Adjustments

The dynamic pricing engine computes pricing based strictly on legitimate, defensible scope, engineering effort, and commercial risk factors:
1. **Scope Scale:** Total pages exceeding the tier's included quota are billed at **$150 per extra page**.
2. **Turnaround Urgency:**
   - Standard timeline: 0% adjustment.
   - Expedited (1 week faster): +15% setup fee surcharge.
   - Urgent / Rush (cut timeline by 50%): +30% setup fee surcharge (reflecting weekend engineering reallocation).
3. **Architectural Dependencies:** Automatic deduplication prevents double-charging. For example, if an E-Commerce tier inherently includes payments, selecting the Payments add-on automatically applies an `includedInBase: true` credit.
4. **Prohibited Personal Attributes:** The pricing engine strictly rejects the use of race, religion, sex, orientation, disability, medical data, political beliefs, or stealth price-gouging algorithms. All identical project configurations produce the exact same deterministic price for all customers.

---

## 5. Discount Stacking Order & Margin Protection Floors

To protect business viability and prevent compounding discount exploits (e.g. 35% global + 15% bundle + 20% coupon), the server strictly enforces an authoritative calculation pipeline:

```
[1. Base Tier Setup & Monthly Prices]
                 ↓
[2. Scope Adjustments (Extra Pages, Turnaround Multipliers)]
                 ↓
[3. Add-On Subtotals (Setup Subtotal & Monthly Subtotal)]
                 ↓
[4. Automatic Add-On Bundle Discount (5%, 10%, 15% on Add-Ons)]
                 ↓
[5. Global Seasonal Promotion (Applied to BOTH Setup & Monthly)]
                 ↓
[6. Database Coupon Validation & Deduction]
                 ↓
[7. Centralized Economic Price Floors & Caps]
   • Minimum Setup Price Floor: $799.00
   • Minimum Monthly Price Floor: $49.00
   • Maximum Combined Discount Cap: 50.0%
                 ↓
[8. Currency Cent Rounding & Schedule Compilation]
```

---

## 6. Immutable Order Snapshots & Zero Legacy Disruption

- **Order Snapshot Model (`backend/models/OrderSnapshot.js`):** When checkout completes, the server writes an immutable snapshot recording the exact tier, add-ons, scope, raw subtotals, applied discount percentages, coupon code, Stripe IDs, client consent timestamp, and terms version string. Future pricing or campaign changes never alter existing agreements.
- **Legacy Compatibility:** Existing customer contracts, recurring subscriptions, and historical Stripe subscription IDs remain 100% active and un-migrated.
