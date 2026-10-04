# Phoenix Websites AI — Comprehensive Technical SEO, GEO & AEO Audit

**Document Date:** October 2026  
**Subject:** Technical SEO, Brand Discoverability, GEO/AEO (AI Search Engine Optimization), Structured Data, and Crawlability Audit  
**Domain:** `https://phoenixwebsites.ai/`  
**Brand Identity:** Phoenix Websites AI  
**Founder:** Carter Moyer  
**Location:** Wisconsin, United States  

---

## 1. Executive Summary & Root Cause Analysis

Phoenix Websites AI is an **AI-native full-stack web development company**. Clients hire Phoenix Websites AI to engineer complete custom websites and full-stack web applications. AI tools are utilized to accelerate the development lifecycle (scaffolding, testing, drafting, boilerplate), while senior human engineering delivers verified architecture, custom logic, security review, quality assurance, and client communication.

### Primary Root Causes for Weak Brand & Entity Discoverability

1. **Weak Homepage H1 & Hero Entity Signals:**
   - **Original H1:** `YOUR IDEA. YOUR WEBSITE.`
   - **Issue:** Neither the brand name (`Phoenix Websites AI`) nor the core service category (`AI Full-Stack Web Development`) was present in the primary heading. Search engine parsers and LLM context extraction algorithms rely heavily on the `<h1>` tag to identify the core subject of the document.
2. **Minimalist Prerender Generator:**
   - The project uses Angular 21 with a post-build prerendering script (`frontend/scripts/prerender.js`) that injects pre-rendered HTML into `<app-root>`.
   - The pre-rendered HTML for the homepage contained only minimal placeholder copy and omitted the critical phrases: *"AI full-stack development company"*, *"AI-native web development"*, *"custom web application development with AI"*, and *"human supervised AI development"*.
   - Crawlers and AI bots that fetch raw HTML saw only a generic outline without the full depth of service information.
3. **Duplicate JSON-LD Structured Data:**
   - `frontend/src/index.html` contained a hardcoded JSON-LD schema graph.
   - `frontend/scripts/prerender.js` injected a second, separate `<script type="application/ld+json">` tag into `<head>` before `</head>`.
   - This caused schema duplication and potential parser confusion on Google Rich Results.
4. **Missing Dedicated High-Intent Service Pages:**
   - Users and AI engines searching for *"AI full stack development company"* or *"AI web development agency"* landed either on the generic home page or a generic custom websites page.
   - Dedicated, deep landing pages for **AI Web Development** (`/services/ai-web-development`) and **Full-Stack AI Development** (`/services/full-stack-development`) were absent.
5. **Incomplete Crawler & AI Bot Directives in `robots.txt`:**
   - The original `robots.txt` lacked explicit permissions for modern generative AI and retrieval crawlers: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, and `ClaudeBot`.
   - It also lacked an explicit link to `llms.txt`.
6. **Sitemap Scope & Freshness:**
   - `sitemap.xml` was locked at a stale `2026-09-30` date and did not index the new dedicated service paths or configurator.

---

## 2. Technical Stack & Rendering Architecture

| Attribute | Implementation |
| :--- | :--- |
| **Frontend Framework** | Angular 21 (Standalone Components, Signals, Router, Modern Control Flow) |
| **Build Tooling** | `@angular/build:application` (Vite dev server + esbuild production pipeline) |
| **Rendering Strategy** | Hybrid Static Prerendering (SSG/Prerender via `scripts/build-tasks.js` & `scripts/prerender.js`) + Dynamic Client-Side Hydration |
| **Backend Framework** | Node.js / Express 4.19 with modular route handlers |
| **Hosting & CDN** | Vercel Global Edge Network with custom edge headers and routing |
| **Database** | MongoDB Atlas via Mongoose |
| **Payment Gateway** | Stripe Checkout (Session-based with server-side validation) |
| **CSS Architecture** | Tailwind CSS + Vanilla CSS custom properties (`styles.css`) |

### Crawlability Without JavaScript
Because `scripts/build-tasks.js postbuild` executes `scripts/prerender.js`, each route produces a standalone `index.html` inside `dist/frontend/[route]/`. When a search bot (Googlebot, Bingbot) or AI crawler (GPTBot, PerplexityBot, ClaudeBot) requests any canonical URL, the server responds with a fully formed HTML document containing:
- Unique `<title>`
- Unique `<meta name="description">`
- Verified `<link rel="canonical">`
- Pre-rendered semantic HTML inside `<app-root>` (headings, paragraphs, feature lists, pricing breakdowns, FAQs)
- Valid JSON-LD structured data

No client-side JavaScript execution is required for crawlers to extract the complete entity profile.

---

## 3. Brand & Entity Discoverability Overhaul

### Brand Mapping
$$\text{Phoenix Websites AI} \equiv \text{phoenixwebsites.ai}$$

### Homepage Title & Heading Hierarchy
- **Title Tag:** `Phoenix Websites AI | AI-Powered Full-Stack Web Development`
- **Meta Description:** `Phoenix Websites AI builds custom websites and full-stack web applications for clients. AI accelerates development while expert human engineers provide architecture, quality assurance, and ongoing care.`
- **H1:** `Phoenix Websites AI — AI-Powered Full-Stack Web Development`
- **Core Value Proposition (First 100 Words):**
  - **WHO:** Phoenix Websites AI, founded by Carter Moyer in Wisconsin, USA.
  - **WHAT:** Full-service custom website and web application development.
  - **HOW:** AI-accelerated code generation and scaffolding combined with senior human oversight, security auditing, and performance optimization.
  - **FOR WHOM:** Businesses, founders, and organizations seeking a finished, custom-engineered product.
  - **WHAT IT IS NOT:** NOT a DIY AI website builder; NOT a template marketplace; NOT a prompt-it-yourself tool; NOT a freelancer broker.

---

## 4. GEO & AEO (Generative Engine Optimization) Strategy

Generative AI search engines (Perplexity, ChatGPT Search, Google AI Overviews, Claude) extract information by parsing structured, factual Q&A blocks and entity-relationship models.

### Target Search Queries Covered Naturally
- *AI full stack development company*
- *AI full stack web development*
- *AI web development company*
- *AI-native development agency*
- *AI-powered web development company*
- *custom website built with AI*
- *company that uses AI to build websites*
- *AI website development service*
- *custom AI website development*
- *AI-assisted full stack development*
- *human supervised AI development*
- *AI developers with human oversight*
- *company that builds a complete website using AI*
- *hire a company to build a website with AI*
- *full stack AI development service*
- *custom web application development with AI*
- *Phoenix Websites AI*

### Self-Contained Knowledge Extraction Points
The site embeds concise factual answers to the 14 foundational questions:
1. **What is Phoenix Websites AI?** A managed AI-native web development agency building bespoke websites and web apps.
2. **What does Phoenix Websites AI build?** Marketing sites, e-commerce stores, client portals, internal SaaS tools, and workflow automation.
3. **Is Phoenix Websites AI a DIY builder?** No. Clients hire us to do all the design, coding, testing, and deployment.
4. **Do customers write prompts?** No. Clients share business requirements; our engineers manage AI workflows.
5. **How is AI utilized?** For accelerating boilerplate generation, initial component scaffolding, and test generation.
6. **Are humans involved?** Yes. Every line of code, architecture, security boundary, and design choice is reviewed and finalized by Carter Moyer.
7. **Can custom full-stack functionality be built?** Yes. Custom databases (MongoDB/PostgreSQL), user authentication, custom dashboards, REST APIs, and third-party integrations.
8. **Who owns the finished code?** The client owns 100% of their custom source code and assets.
9. **What technologies are used?** Angular, TypeScript, Node.js, Express, Tailwind CSS, MongoDB, Stripe, and edge cloud infrastructure.
10. **What is the development process?** Discovery → Architecture → AI-Accelerated Development → Senior Engineering Review → Launch & Managed Care.
11. **How fast are projects delivered?** Starter sites in 1–2 weeks; custom web apps in 3–5 weeks.
12. **How much does it cost?** Starter websites from $1,499; custom business sites from $2,499; modular full-stack projects scoped dynamically via our transparent configurator.
13. **What happens after launch?** Managed hosting, automated backups, 24/7 uptime monitoring, and optional monthly engineering hours.

---

## 5. Structured Data (JSON-LD) Architecture

All JSON-LD is consolidated into valid, clean `@graph` structures without duplicates:

1. **`Organization` Schema:**
   - Identity: `Phoenix Websites AI`
   - URL: `https://phoenixwebsites.ai`
   - Founder: `Carter Moyer` (`https://carter-portfolio.fyi`)
   - Region: Wisconsin, US
   - Contact: `hello@phoenixwebsites.ai`, `+1-760-334-7874`
   - Social: YouTube & Patreon profiles
2. **`WebSite` Schema:**
   - Name: `Phoenix Websites AI`
   - URL: `https://phoenixwebsites.ai`
3. **`ProfessionalService` Schema:**
   - Catalog: AI Web Development, Full-Stack Development, Business Automation, AI Conversational Assistants, Data Cleanup.
4. **`FAQPage` Schema:**
   - Directly maps the 14 core queries for instant rich result eligibility on Google and direct snippet extraction by Perplexity and ChatGPT.
5. **`BreadcrumbList` Schema:**
   - Clear hierarchical navigation across `/services`, `/services/ai-web-development`, `/services/full-stack-development`, etc.

---

## 6. Crawler Accessibility (`robots.txt` & `llms.txt`)

### `robots.txt` Configuration
- Whitelists and welcomes:
  - `Googlebot` & `Bingbot` (Traditional Search)
  - `GPTBot` & `OAI-SearchBot` & `ChatGPT-User` (OpenAI Search & Training)
  - `PerplexityBot` (Perplexity AI)
  - `ClaudeBot` (Anthropic AI)
- Disallows internal and authenticated paths:
  - `/growth-crm`, `/dashboard`, `/checkout`, `/checkout-success`, `/admin-reviews`, `/leave-review`
- Links directly to `sitemap.xml` and includes reference to `llms.txt`.

### `llms.txt` Standard
Provides a Markdown-formatted context briefing for LLMs specifying company summary, service breakdown, technology stack, human-in-the-loop guarantee, and links to canonical documentation.

---

## 7. Remaining External Owner Actions

The following actions require external account access and cannot be automated from local code:
1. **Google Search Console Verification:**
   - Navigate to [Google Search Console](https://search.google.com/search-console).
   - Ensure the property `https://phoenixwebsites.ai/` is verified (via DNS TXT record or HTML verification tag).
   - Submit `https://phoenixwebsites.ai/sitemap.xml` under Sitemaps.
2. **Bing Webmaster Tools:**
   - Import the verified Google Search Console property into Bing Webmaster Tools.
   - Verify that `https://phoenixwebsites.ai/sitemap.xml` is processed.
3. **DNS DKIM / DMARC Setup:**
   - As noted in the business audit, configure a DMARC policy (`v=DMARC1; p=none; rua=mailto:hello@phoenixwebsites.ai`) in DNS to protect domain reputation and deliverability.
