# Phoenix-Business (phoenixwebsites.ai)

Phoenix's customer-facing business website and service platform. Handles client onboarding, Stripe billing, contract management, review collection, and the public AI Data Intelligence portal.

> **Live at**: [phoenixwebsites.ai](https://phoenixwebsites.ai)  
> **Data Portal**: [phoenixwebsites.ai/data](https://phoenixwebsites.ai/data)

---

## Architecture

```
Phoenix-Business/
├── backend/                      # Node/Express API (Vercel Serverless)
│   ├── models/
│   │   ├── User.js / user.js     # Client accounts (Google OAuth + local)
│   │   ├── Contract.js           # Service contracts with PDF snapshots
│   │   ├── Review.js             # Client reviews (token-gated)
│   │   └── ProcessedEvent.js     # Stripe webhook deduplication
│   ├── services/
│   │   ├── legal.service.js      # PDF contract generation (Terms, Refund, Privacy, Data Services Agreement)
│   │   └── ...
│   └── routes/
│       ├── stripe.js             # Stripe checkout, webhooks, contracts, pricing, cancellation
│       ├── data-portal.js        # Public data intelligence portal API
│       ├── auth.js               # Google OAuth + local auth
│       ├── reviews.js            # Review management + token-gated submission
│       ├── bot.js                # AI chatbot (GPT-4o)
│       ├── leads.js              # Cross-app lead merge (shared MongoDB)
│       └── cron.js               # Daily renewals + refund checks
├── frontend/                     # Angular 21 (Standalone, Signals, TailwindCSS)
│   └── src/app/
│       ├── home/                 # Landing page
│       ├── about/                # About page
│       ├── services-page/        # Service tiers + checkout
│       ├── data-portal/          # Public Data Intelligence portal
│       ├── dashboard/            # Client dashboard
│       ├── reviews/              # Public reviews page
│       ├── leave-review/         # Token-gated review submission
│       ├── admin-reviews/        # Review moderation (Carter-only)
│       ├── legal/                # Terms, Refund, Privacy pages
│       └── shared/
│           ├── navbar/           # Site navigation (Home, About, Services, Data, Reviews)
│           ├── footer/
│           ├── ai-bot/           # Floating AI assistant
│           ├── review-popup/     # Random review ticker
│           └── background-animation/
└── vercel.json                   # Vercel config with SPA rewrites + 2 crons
```

## Service Tiers

### Website Services (Subscription — 12-month contract)
| Tier | Setup | Monthly | Trial |
|------|-------|---------|-------|
| Simple Landing Page | — | One-time | — |
| Starter | Setup fee | Monthly | 30 days |
| Professional | Setup fee | Monthly | 30 days |
| Enterprise | Setup fee | Monthly | 30 days |

### Data Intelligence (One-Time, Non-Refundable)
| Tier | Price | Records/Day | Sources |
|------|-------|-------------|---------|
| Data Starter | $149 | 50 | 2 |
| Data Pro | $499 | 200 | All + auto-outreach |
| Data + Website Bundle | $799 | 200 | All + custom website |

## Data Portal Flow

```
1. Google indexes phoenixwebsites.ai/data → organic traffic
2. User searches → preview cards (company, project, budget, city)
3. Contact info LOCKED (🔒) → "Unlock Full Record — From $149"
4. Click → Stripe one-time payment → purchase token generated
5. Token unlocks /data/:id/full endpoint → full record with contacts
```

Each record has a unique shareable URL: `phoenixwebsites.ai/data/{recordId}`  
Outreach emails include the direct link → prospect clicks → views → buys.

## Legal Contracts

Auto-generated PDFs attached to every purchase:
- **Terms of Service** — service scope, IP, liability
- **Refund Policy** — website tiers: pro-rata within 14 days; data tiers: **non-refundable**
- **Privacy Policy** — data handling, GDPR/CCPA basics
- **Data Services Agreement** — FOIA sourcing, AI disclaimer, permitted use, non-refundable clause

## Environment Variables

```env
MONGODB_URI=               # Shared cluster with Cold-Emailing-Website
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=          # OAuth
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
EMAIL_USER=                # SMTP (Zoho)
EMAIL_PASS=
SMTP_HOST=smtppro.zoho.com
SMTP_PORT=465
PROD_FRONTEND_URL=https://phoenixwebsites.ai
PRODUCTION=true
TWILIO_SID=                # SMS alerts
TWILIO_AUTH_TOKEN=
TWILIO_PHONE=
ADMIN_PHONE=

# Data Tier Pricing (cents)
PRICE_DATA_STARTER=14900
PRICE_DATA_PRO=49900
PRICE_DATA_BUNDLE=79900
```

## Vercel Crons (2 slots)

| Cron | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/check-refunds` | Daily 12:00 UTC | Process pending refund requests |
| `/api/cron/daily-renewals` | Daily 08:00 UTC | Process subscription renewals |

## Development

```bash
# Full stack
npm run dev

# Or separately:
cd backend && npm start
cd frontend && ng serve
```

## Deployment
```bash
vercel --prod
```
