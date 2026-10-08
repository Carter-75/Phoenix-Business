const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist', 'frontend');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('[prerender] Error: dist/frontend/index.html not found! Run ng build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const routes = [
  {
    path: '/',
    title: 'Phoenix Websites AI | AI-Powered Full-Stack Web Development',
    description: 'Phoenix Websites AI is an AI-native full-stack web development company. We build complete custom websites and web applications using AI acceleration with senior human engineering oversight.',
    canonicalUrl: 'https://phoenixwebsites.ai/',
    heading: 'AI-Powered Full-Stack Web Development',
    content: `
      <section class="hero-section">
        <p class="tagline">PHOENIX WEBSITES AI // AI-NATIVE DIGITAL STUDIO</p>
        <h1>AI-POWERED FULL-STACK WEB DEVELOPMENT</h1>
        <p class="subtitle">Phoenix Websites AI is an AI-native web development company that builds custom websites and full-stack web applications for clients. AI accelerates development while human oversight is used for architecture, review, quality assurance, and delivery.</p>
        <p class="explanation">Customers hire Phoenix Websites AI to have a complete custom website or web application engineered for them. It is not a DIY website builder, not a template marketplace, and not a service where customers must prompt an AI themselves. You provide the goals and requirements—our senior engineers handle complete architecture, full-stack implementation, database design, testing, and managed deployment.</p>
        <div class="actions">
          <a href="/#configurator" class="btn-primary">Launch Project Configurator</a>
          <a href="/services" class="btn-secondary">View Website Plans &amp; Pricing</a>
          <a href="/services/ai-web-development" class="btn-secondary">AI Web Development</a>
          <a href="/services/full-stack-development" class="btn-secondary">Full-Stack Development</a>
        </div>
      </section>

      <section class="services-overview">
        <h2>Core Services &amp; Engineering Capabilities</h2>
        <article class="service-card">
          <h3>Custom Website Development</h3>
          <p>Bespoke web applications built from scratch with modern frameworks and AI-accelerated workflows. Engineered for speed, SEO, and conversion—managed from architecture to deployment.</p>
          <a href="/services/custom-websites">Learn more about custom website development</a>
        </article>
        <article class="service-card">
          <h3>Full-Stack Web Applications &amp; SaaS</h3>
          <p>Interactive web applications, customer portals, administrative dashboards, authentication systems, and relational databases engineered with senior human review.</p>
          <a href="/services/full-stack-development">Learn more about full-stack development</a>
        </article>
        <article class="service-card">
          <h3>AI Web Development</h3>
          <p>AI-native web engineering delivering complete custom solutions in days rather than months, backed by senior human architecture and quality control.</p>
          <a href="/services/ai-web-development">Learn more about AI web development</a>
        </article>
        <article class="service-card">
          <h3>Business Process Automation</h3>
          <p>Instant lead routing, SMS alerts, CRM integration, and webhook pipelines that eliminate manual operational tasks.</p>
          <a href="/services/automation">Learn more about business process automation</a>
        </article>
        <article class="service-card">
          <h3>AI Solutions &amp; Conversational Assistants</h3>
          <p>24/7 web voice assistants, grounded inquiry chatbots with strict factual guardrails, and automated lead triage tools.</p>
          <a href="/services/ai-solutions">Learn more about AI solutions</a>
        </article>
        <article class="service-card">
          <h3>Data Cleaning &amp; Organization</h3>
          <p>Spreadsheet normalization, deduplication, and reporting on client-provided files using Microsoft tools and AI assistance.</p>
          <a href="/data-cleanup">Learn more about data cleanup</a>
        </article>
      </section>

      <section class="geo-knowledge-section" id="faq">
        <h2>Frequently Asked Questions About Phoenix Websites AI</h2>
        <div class="faq-item">
          <h3>What is Phoenix Websites AI?</h3>
          <p>Phoenix Websites AI is an AI-native web development company that builds custom websites and full-stack web applications for clients. AI accelerates development while human oversight is used for architecture, review, quality assurance, and delivery.</p>
        </div>
        <div class="faq-item">
          <h3>Is Phoenix Websites AI an AI website builder?</h3>
          <p>No. Phoenix Websites AI is not a DIY AI website builder, not a template marketplace, and not a platform where you must prompt an AI yourself. You hire our team to build, test, and launch a complete custom digital product tailored to your exact specifications.</p>
        </div>
        <div class="faq-item">
          <h3>Do customers build the website themselves?</h3>
          <p>No. Phoenix Websites AI is a turnkey, white-glove engineering service. You provide your business requirements, goals, and content assets. We handle design, custom frontend and backend programming, database configuration, security hardening, and deployment.</p>
        </div>
        <div class="faq-item">
          <h3>How is AI used in the development process?</h3>
          <p>We leverage advanced AI models and agentic workflows to rapidly generate boilerplate code, scaffold APIs, write automated test suites, optimize performance, and accelerate initial prototypes. This allows us to deliver projects in days rather than months while drastically lowering costs.</p>
        </div>
        <div class="faq-item">
          <h3>Are humans involved in every project?</h3>
          <p>Yes, absolutely. Senior human software engineers architect the system, inspect every line of code, enforce security protocols, conduct end-to-end quality assurance, and directly manage client communication.</p>
        </div>
        <div class="faq-item">
          <h3>Can Phoenix Websites AI build custom functionality and full-stack applications?</h3>
          <p>Yes. Beyond marketing websites, we build complete full-stack web applications, SaaS MVPs, customer portals, custom administrative dashboards, payment integrations, relational/document databases, REST/GraphQL APIs, and background job workers.</p>
        </div>
        <div class="faq-item">
          <h3>Who owns the finished website and source code?</h3>
          <p>During your subscription, you receive an exclusive commercial license to use and display your custom website. You can take full ownership of the source code at any time via our Source Code Buyout option (50% of the original setup fee), which transfers complete intellectual property rights to you with zero ongoing obligations.</p>
        </div>
        <div class="faq-item">
          <h3>How does the development process and pricing work?</h3>
          <p>We offer transparent dynamic project estimates via our interactive configurator. Base setup fees start at $1,499 for Starter websites, $2,499 for Business platforms, $3,499 for E-Commerce stores, and $4,999 for full-stack Web Applications. All tiers include mandatory managed monthly care (starting at $99/mo) with a 12-month commitment. Seasonal promotions of 20–45% off apply throughout the year. Delivery ranges from 2 to 5 weeks depending on scope.</p>
        </div>
      </section>

      <section class="audit-section" id="audit">
        <h2>Request a Free Website Audit or Scope Review</h2>
        <p>Request an engineering review of your current site, mobile performance, conversion funnel, and SEO structure. You will receive actionable recommendations. No purchase required.</p>
        <p>Contact us at hello@phoenixwebsites.ai or call +1 (760) 334-7874.</p>
      </section>
    `,
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://phoenixwebsites.ai/#organization",
          "name": "Phoenix Websites AI",
          "url": "https://phoenixwebsites.ai",
          "logo": "https://phoenixwebsites.ai/logo.png",
          "email": "hello@phoenixwebsites.ai",
          "telephone": "+1-760-334-7874",
          "description": "Phoenix Websites AI is an AI-native full-stack web development company that builds complete custom websites and web applications with senior human oversight.",
          "founder": {
            "@type": "Person",
            "name": "Carter Moyer",
            "url": "https://carter-portfolio.fyi"
          },
          "sameAs": [
            "https://www.youtube.com/channel/UCfawV121RAj1CYU69Nk69Rg",
            "https://www.patreon.com/PhoenixWebsites"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://phoenixwebsites.ai/#website",
          "url": "https://phoenixwebsites.ai",
          "name": "Phoenix Websites AI",
          "publisher": {
            "@id": "https://phoenixwebsites.ai/#organization"
          }
        },
        {
          "@type": "ProfessionalService",
          "@id": "https://phoenixwebsites.ai/#service",
          "name": "Phoenix Websites AI - Full-Stack Web Development",
          "url": "https://phoenixwebsites.ai",
          "image": "https://phoenixwebsites.ai/logo.png",
          "description": "Custom websites and full-stack web applications engineered with AI acceleration and senior human oversight.",
          "priceRange": "$$",
          "telephone": "+1-760-334-7874",
          "email": "hello@phoenixwebsites.ai"
        },
        {
          "@type": "FAQPage",
          "@id": "https://phoenixwebsites.ai/#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is Phoenix Websites AI?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Phoenix Websites AI is an AI-native web development company that builds custom websites and full-stack web applications for clients. AI accelerates development while human oversight is used for architecture, review, quality assurance, and delivery."
              }
            },
            {
              "@type": "Question",
              "name": "Is Phoenix Websites AI an AI website builder?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. Phoenix Websites AI is not a DIY AI website builder, not a template marketplace, and not a service where customers prompt an AI themselves. Clients hire Phoenix Websites AI to engineer a complete, custom digital product."
              }
            },
            {
              "@type": "Question",
              "name": "How is AI used in the development process?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "AI accelerates boilerplate generation, API scaffolding, automated testing, and performance optimization, while senior human software engineers oversee system architecture, security, code reviews, and deployment."
              }
            },
            {
              "@type": "Question",
              "name": "Who owns the finished website and source code?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "During your subscription, you receive an exclusive commercial license to use your custom website. Full intellectual property ownership is available via the Source Code Buyout option (50% of original setup fee), which transfers complete IP rights with zero ongoing obligations."
              }
            }
          ]
        }
      ]
    }
  },
  {
    path: '/services',
    title: 'Website Plans & Services | Phoenix Websites AI',
    description: 'Explore custom website development plans, pricing, business automation, AI solutions, and data cleanup by Phoenix Websites AI. Lifetime price lock on all website tiers.',
    canonicalUrl: 'https://phoenixwebsites.ai/services',
    heading: 'Websites & Growth Plans',
    content: `
      <section class="services-hub">
        <h1>Websites &amp; Growth Plans</h1>
        <p>Tell us what you want your website to do, and choose a plan that fits its scope. All monthly plans include a 12-month commitment and our lifetime price lock guarantee.</p>
        
        <h2>Specialized Service Areas</h2>
        <ul>
          <li><a href="/services/custom-websites">Custom Website Development</a> — Bespoke web engineering without DIY builder limitations.</li>
          <li><a href="/services/automation">Business Process Automation</a> — Form routing, SMS/email alerts, and CRM workflows.</li>
          <li><a href="/services/ai-solutions">AI Solutions &amp; Assistants</a> — Web voice tools, grounded chatbots, and triage.</li>
          <li><a href="/data-cleanup">Data Cleaning &amp; Organization</a> — Spreadsheet formatting, deduplication, and reports.</li>
        </ul>

        <h2>Subscription Tiers &amp; Pricing</h2>
        <article class="tier">
          <h3>Simple Launch</h3>
          <p>Essential foundation for your business. Fast, custom website designed to convert. Includes hosting, basic maintenance. Max 2-week delivery.</p>
        </article>
        <article class="tier">
          <h3>Essential Care</h3>
          <p>Ongoing maintenance and support. Includes 2 hours/month custom edits, hosting, 24/7 uptime monitoring, Google Business management. Max 3-week delivery.</p>
        </article>
        <article class="tier">
          <h3>Professional Growth</h3>
          <p>Scaling revenue through data-driven improvements and automation. Includes 5 hours/month custom edits, monthly analytics, AI chatbot upkeep. Max 4-week delivery.</p>
        </article>
        <article class="tier">
          <h3>Enterprise Custom</h3>
          <p>Fully custom enterprise architecture. 10+ hours/month custom engineering, dedicated management, custom SLAs. Timeline by scope.</p>
        </article>
      </section>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Website Development & Digital Services",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      }
    }
  },
  {
    path: '/services/custom-websites',
    title: 'Custom Website Development Services | Phoenix Websites AI',
    description: 'Hire Phoenix Websites AI to design, build, and maintain your custom website. AI-assisted custom development, high-speed performance, and managed hosting.',
    canonicalUrl: 'https://phoenixwebsites.ai/services/custom-websites',
    heading: 'AI-Assisted Custom Website Development',
    content: `
      <article class="service-detail">
        <h1>AI-Assisted Custom Website Development</h1>
        <p>You hire Phoenix Websites AI to handle your entire web project from architecture to launch. We build bespoke, lightning-fast web applications—not bloated DIY website builder templates.</p>
        
        <h2>Why Hire Us Instead of Using a DIY Builder?</h2>
        <p>DIY builders require you to spend dozens of hours wrestling with generic templates, fragile plugins, and design tools. With Phoenix Websites AI, you hire Carter to plan, build, test, and maintain the site for you.</p>

        <h2>Who This Service Helps</h2>
        <p>Local and service contractors, boutique e-commerce brands, and growing businesses needing custom customer portals and lead pipelines.</p>

        <h2>Verified Timelines &amp; Delivery</h2>
        <ul>
          <li><strong>Simple Launch:</strong> Max 2-week delivery.</li>
          <li><strong>Essential Care:</strong> Max 3-week delivery.</li>
          <li><strong>Professional Growth:</strong> Max 4-week delivery.</li>
          <li><strong>Enterprise Custom:</strong> Timeline determined by custom scope.</li>
        </ul>
        <a href="/#audit">Request a Free Website Audit</a>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Custom Website Development",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      }
    }
  },
  {
    path: '/services/automation',
    title: 'Business Process Automation Services | Phoenix Websites AI',
    description: 'Streamline customer intake, lead notifications, SMS alerts, and CRM integrations with custom workflow automation from Phoenix Websites AI.',
    canonicalUrl: 'https://phoenixwebsites.ai/services/automation',
    heading: 'Business Process Automation',
    content: `
      <article class="service-detail">
        <h1>Business Process Automation</h1>
        <p>Stop losing leads and wasting hours on repetitive manual tasks. We engineer robust, automated pipelines connecting your website, email, SMS alerts, and internal systems.</p>

        <h2>Core Automation Capabilities</h2>
        <ul>
          <li><strong>Instant Lead Routing &amp; Alerts:</strong> Immediate SMS and email triggers to phone numbers and inboxes.</li>
          <li><strong>CRM &amp; Database Sync:</strong> Direct intake parsing into Google Sheets, databases, and CRMs.</li>
          <li><strong>Webhook Pipelines:</strong> Connecting Stripe, notification systems, and client records.</li>
        </ul>
        <a href="/#audit">Request an Automation Consultation</a>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Business Process Automation",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      }
    }
  },
  {
    path: '/services/ai-solutions',
    title: 'AI Solutions & Conversational Assistants | Phoenix Websites AI',
    description: 'Integrate 24/7 web voice assistants, grounded inquiry chatbots, and intelligent lead triage into your business with Phoenix Websites AI.',
    canonicalUrl: 'https://phoenixwebsites.ai/services/ai-solutions',
    heading: 'AI Solutions & Conversational Tools',
    content: `
      <article class="service-detail">
        <h1>AI Solutions &amp; Conversational Tools</h1>
        <p>Equip your business with 24/7 client response. We build purpose-driven AI web voice assistants, grounded inquiry chatbots, and intelligent workflow tools with strict factual guardrails.</p>

        <h2>What We Build</h2>
        <ul>
          <li><strong>Browser &amp; Phone Voice Assistants:</strong> Direct spoken communication in the browser or via phone line.</li>
          <li><strong>Grounded Customer Chatbots:</strong> Trained exclusively on your verified business facts without hallucinations.</li>
          <li><strong>Intelligent Lead Triage:</strong> Automated categorization of client project requirements.</li>
        </ul>
        <a href="/#audit">Request an AI Solution Quote</a>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "AI Solutions & Conversational Assistants",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      }
    }
  },
  {
    path: '/data-cleanup',
    title: 'Data Cleanup & Organization Services | Phoenix Websites AI',
    description: 'Clean, normalize, and organize messy spreadsheets and client-provided files with Microsoft tools and AI assistance by Phoenix Websites AI. Quote before work begins.',
    canonicalUrl: 'https://phoenixwebsites.ai/data-cleanup',
    heading: 'Data Cleanup & Organization',
    content: `
      <article class="service-detail">
        <h1>Put Your Files To Work</h1>
        <p>Get help cleaning and organizing the data you already have. Work directly with Carter to turn messy spreadsheets into clear, useful files and reports. Microsoft tools and AI assist the work. We agree on the scope and price before project starts.</p>

        <h2>Capabilities</h2>
        <ul>
          <li><strong>Clean Up:</strong> Review duplicate rows, inconsistent names, missing values, and formatting problems.</li>
          <li><strong>Organize:</strong> Arrange client-provided spreadsheets and CSV files into a consistent structure.</li>
          <li><strong>Make It Useful:</strong> Prepare tables, summaries, or reports that fit the work you need to do.</li>
        </ul>
        <a href="/data-cleanup">Request a Data Project Review</a>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Data Cleanup & Organization",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      }
    }
  },
  {
    path: '/about',
    title: 'About & Engineering Philosophy | Phoenix Websites AI',
    description: 'Learn about Phoenix Websites AI, lead developer Carter Moyer, and our zero-latency engineering philosophy. Based in Wisconsin, USA.',
    canonicalUrl: 'https://phoenixwebsites.ai/about',
    heading: 'About Phoenix Websites AI',
    content: `
      <article class="about-detail">
        <h1>Philosophy &amp; Foundations</h1>
        <p>Phoenix Websites AI is an engineering-first web studio founded by Carter Moyer, based in Wisconsin, USA. We build custom websites, automation pipelines, and AI systems with zero-latency engineering principles.</p>
        <h2>Core Standards</h2>
        <ul>
          <li>Fast loading for every visitor</li>
          <li>Smart tools that save you time</li>
          <li>100% reliability and direct communication</li>
        </ul>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Phoenix Websites AI"
    }
  },
  {
    path: '/reviews',
    title: 'Client Ratings & Verified Reviews | Phoenix Websites AI',
    description: 'Read verified client ratings and feedback on custom website development, automation, and AI solutions by Phoenix Websites AI.',
    canonicalUrl: 'https://phoenixwebsites.ai/reviews',
    heading: 'Client Ratings & Reviews',
    content: `
      <article class="reviews-detail">
        <h1>Client Ratings &amp; Reviews</h1>
        <p>Real feedback from verified businesses scaling their web presence and systems with Phoenix Websites AI.</p>
        <p>Reviews are submitted by verified clients upon completion of their website projects and service milestones.</p>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Client Ratings & Reviews"
    }
  },
  {
    path: '/services/ai-web-development',
    title: 'AI Web Development Company | Custom AI-Assisted Websites | Phoenix Websites AI',
    description: 'Hire an AI-native web development company. Complete custom websites and web applications built with AI speed and senior human engineering oversight.',
    canonicalUrl: 'https://phoenixwebsites.ai/services/ai-web-development',
    heading: 'AI-Native Web Development Company',
    content: `
      <article class="service-detail">
        <p class="tagline">ENGINEERED FOR SPEED // VERIFIED BY SENIOR ENGINEERS</p>
        <h1>AI-Native Web Development Company</h1>
        <p class="lead">Phoenix Websites AI is an AI-native web development company that builds custom websites and full-stack web applications for clients. AI accelerates development while human oversight is used for architecture, review, quality assurance, and delivery.</p>

        <h2>Turnkey Development — Not a DIY Builder</h2>
        <p>Clients hire Phoenix Websites AI to deliver finished, custom web systems. It is not a DIY website builder, not a template marketplace, and not a service where customers must prompt an AI themselves. You provide business requirements, brand goals, and content—our engineers deliver a complete, production-ready web application.</p>

        <h2>The Division of Labor: AI Speed vs Human Oversight</h2>
        <ul>
          <li><strong>What AI Accelerates:</strong> Boilerplate synthesis, API route scaffolding, responsive layout generation, automated unit tests, and performance optimization.</li>
          <li><strong>What Senior Engineers Oversee:</strong> Scalable system architecture, business logic verification, relational database schema modeling, authentication and security audits, cross-device QA, and client communication.</li>
        </ul>

        <h2>What We Build</h2>
        <ul>
          <li><strong>High-Performance Marketing Websites:</strong> Sub-second load times, structured schema markup, and conversion-optimized funnels.</li>
          <li><strong>Full-Stack Web Applications:</strong> Dynamic portals, authenticated dashboards, and custom business tooling.</li>
          <li><strong>E-Commerce Platforms:</strong> Stripe-integrated catalogs, inventory management, and automated order flows.</li>
          <li><strong>Automated Business Workflows:</strong> Instant SMS/email lead routing, CRM synchronization, and webhook pipelines.</li>
        </ul>

        <h2>Transparent Dynamic Pricing &amp; Timeline</h2>
        <p>Setup fees start at $1,499 for Starter websites (delivered in 2 weeks) up to $4,999+ for full-stack custom web applications (delivered in 5 weeks). All tiers include mandatory managed monthly care with a 12-month commitment. Seasonal promotions of 20–45% off apply throughout the year. You receive an exclusive commercial license during subscription, with full IP ownership available via the Source Code Buyout option.</p>

        <div class="actions">
          <a href="/#configurator" class="btn-primary">Calculate Your Project Price</a>
          <a href="/services" class="btn-secondary">Explore All Plans</a>
        </div>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "AI Web Development Services",
      "serviceType": "AI-Powered Web Development",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      },
      "description": "Custom websites and web applications engineered with AI acceleration and senior human oversight.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "1499",
        "highPrice": "14999"
      }
    }
  },
  {
    path: '/services/full-stack-development',
    title: 'Full-Stack AI Development Company | Custom Web Apps & SaaS MVPs | Phoenix Websites AI',
    description: 'Custom full-stack web application development accelerated by AI. High-performance databases, authentication, dashboards, and APIs built with senior human review.',
    canonicalUrl: 'https://phoenixwebsites.ai/services/full-stack-development',
    heading: 'Full-Stack Web Application Development with AI Acceleration',
    content: `
      <article class="service-detail">
        <p class="tagline">FULL-STACK ENGINEERING // PRODUCTION-GRADE ARCHITECTURE</p>
        <h1>Full-Stack Web Application Development with AI Acceleration</h1>
        <p class="lead">Transform complex product specifications into robust, production-grade web applications in weeks, not months. Phoenix Websites AI combines agentic AI scaffolding with senior human software engineering.</p>

        <h2>Complete Full-Stack Capabilities</h2>
        <ul>
          <li><strong>Authentication &amp; RBAC:</strong> Multi-tenant user login, session tokens, JWTs, OAuth2, and granular role-based access control.</li>
          <li><strong>Relational &amp; Document Databases:</strong> MongoDB, PostgreSQL, and Supabase schemas modeled for performance, ACID compliance, and data integrity.</li>
          <li><strong>Dynamic Dashboards &amp; Portals:</strong> Reactive, real-time client portals, analytics charting, and operational administrative tooling.</li>
          <li><strong>REST &amp; GraphQL APIs:</strong> Secure, self-documenting endpoints connecting frontend clients to third-party services and background workers.</li>
          <li><strong>Payment &amp; Subscription Engines:</strong> Stripe Billing, webhook verification, prorated subscriptions, and customer checkout portals.</li>
        </ul>

        <h2>Code Ownership &amp; Production Deployment</h2>
        <p>During your subscription, you receive an exclusive commercial license to use and deploy your custom application. Full IP ownership—including the complete Git repository, database migration scripts, and documentation—is available via our Source Code Buyout option (50% of the original setup fee). No vendor lock-in once the buyout is complete.</p>

        <div class="actions">
          <a href="/#configurator" class="btn-primary">Launch Project Estimator</a>
          <a href="/services" class="btn-secondary">View Website Plans</a>
        </div>
      </article>
    `,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Full-Stack Web Application Development",
      "serviceType": "Full-Stack Development",
      "provider": {
        "@type": "Organization",
        "name": "Phoenix Websites AI",
        "url": "https://phoenixwebsites.ai"
      },
      "description": "Full-stack web application, custom database, API, and SaaS development accelerated by AI with senior human oversight.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "4999",
        "highPrice": "14999"
      }
    }
  },
  {
    path: '/terms',
    title: 'Terms of Service | Phoenix Websites AI',
    description: 'Terms of Service for custom website development and subscription tiers at Phoenix Websites AI.',
    canonicalUrl: 'https://phoenixwebsites.ai/terms',
    heading: 'Terms of Service',
    content: `<h1>Terms of Service</h1><p>Terms and conditions governing custom web design, subscription commitments, and development services with Phoenix Websites AI.</p>`
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Phoenix Websites AI',
    description: 'Privacy Policy for Phoenix Websites AI. Learn how we handle client data, lead inquiries, and cookies.',
    canonicalUrl: 'https://phoenixwebsites.ai/privacy',
    heading: 'Privacy Policy',
    content: `<h1>Privacy Policy</h1><p>Phoenix Websites AI respects your privacy. We do not sell your personal data or spam inquiry contacts.</p>`
  },
  {
    path: '/refunds',
    title: 'Refund Policy | Phoenix Websites AI',
    description: 'Refund Policy for custom website development and service tiers at Phoenix Websites AI.',
    canonicalUrl: 'https://phoenixwebsites.ai/refunds',
    heading: 'Refund Policy',
    content: `<h1>Refund Policy</h1><p>Details regarding our delivery satisfaction standards, subscription commitments, and project refund remedies.</p>`
  }
];

function generateHtmlForRoute(route) {
  let html = baseHtml;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${route.title}</title>`);

  // Replace or inject Meta Description
  if (html.includes('name="description"')) {
    html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${route.description}">`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${route.description}">\n</head>`);
  }

  // Update Canonical
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link rel="canonical" href=".*?">/i, `<link rel="canonical" href="${route.canonicalUrl}">`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${route.canonicalUrl}">\n</head>`);
  }

  // Update OG & Twitter
  html = html.replace(/<meta property="og:title" content=".*?">/i, `<meta property="og:title" content="${route.title}">`);
  html = html.replace(/<meta property="og:description" content=".*?">/i, `<meta property="og:description" content="${route.description}">`);
  html = html.replace(/<meta property="og:url" content=".*?">/i, `<meta property="og:url" content="${route.canonicalUrl}">`);
  html = html.replace(/<meta name="twitter:title" content=".*?">/i, `<meta name="twitter:title" content="${route.title}">`);
  html = html.replace(/<meta name="twitter:description" content=".*?">/i, `<meta name="twitter:description" content="${route.description}">`);

  // Inject Pre-rendered Content into <app-root>
  const preRenderedApp = `<app-root>
    <div class="prerendered-content" style="max-width:1400px;margin:0 auto;padding:120px 24px 60px;color:#fff;font-family:Inter,system-ui,sans-serif;">
      ${route.content}
    </div>
  </app-root>`;

  html = html.replace(/<app-root><\/app-root>/i, preRenderedApp);

  // If specific route schema exists, clean existing schema from baseHtml and inject route schema
  if (route.schema) {
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
    const schemaTag = `\n  <script type="application/ld+json">\n  ${JSON.stringify(route.schema, null, 2)}\n  </script>\n</head>`;
    html = html.replace('</head>', schemaTag);
  }

  return html;
}

// Generate static HTML for each route
routes.forEach(route => {
  const rendered = generateHtmlForRoute(route);
  if (route.path === '/') {
    fs.writeFileSync(indexHtmlPath, rendered, 'utf8');
    console.log('[prerender] Rendered: dist/frontend/index.html');
  } else {
    const routeDir = path.join(distDir, route.path.replace(/^\//, ''));
    fs.mkdirSync(routeDir, { recursive: true });
    const targetFile = path.join(routeDir, 'index.html');
    fs.writeFileSync(targetFile, rendered, 'utf8');
    console.log('[prerender] Rendered: ' + targetFile);
  }
});

// Also create /home redirect to canonical /
const homeDir = path.join(distDir, 'home');
fs.mkdirSync(homeDir, { recursive: true });
const homeRedirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Phoenix Websites AI</title>
  <link rel="canonical" href="https://phoenixwebsites.ai/">
  <meta http-equiv="refresh" content="0; url=https://phoenixwebsites.ai/">
  <script>location.replace('/');</script>
</head>
<body>
  <p>Redirecting to <a href="/">https://phoenixwebsites.ai/</a>...</p>
</body>
</html>`;
fs.writeFileSync(path.join(homeDir, 'index.html'), homeRedirectHtml, 'utf8');
console.log('[prerender] Rendered canonical redirect: dist/frontend/home/index.html');

console.log('[prerender] All static HTML pages generated successfully.');
