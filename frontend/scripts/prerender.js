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
    title: 'AI-Assisted Custom Website Development | Phoenix Websites AI',
    description: 'Custom website development, business automation, AI solutions, and data cleaning by Phoenix Websites AI. Work directly with Carter to design, build, and launch high-performance web systems.',
    canonicalUrl: 'https://phoenixwebsites.ai/',
    heading: 'AI-Assisted Custom Website Development',
    content: `
      <section class="hero-section">
        <h1>AI-Assisted Custom Website Development</h1>
        <p class="subtitle">Custom websites, business automation, AI tools, and data organization. You hire us to handle every phase of design, custom engineering, and managed hosting—not a DIY website builder. Work directly with Carter to build high-performance web systems tailored to your business.</p>
        <div class="actions">
          <a href="/#audit" class="btn-primary">Request a Free Website Audit</a>
          <a href="/services" class="btn-secondary">View Website Plans &amp; Pricing</a>
        </div>
      </section>

      <section class="services-overview">
        <h2>Core Services &amp; Capabilities</h2>
        <article class="service-card">
          <h3>Custom Website Development</h3>
          <p>Bespoke web applications built from scratch with modern frameworks and AI-accelerated workflows. Managed from design to deployment.</p>
          <a href="/services/custom-websites">Learn more about custom website development</a>
        </article>
        <article class="service-card">
          <h3>Business Process Automation</h3>
          <p>Instant lead routing, SMS alerts, CRM integration, and webhook pipelines that eliminate manual tasks.</p>
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

      <section class="audit-section" id="audit">
        <h2>Request a Free Website Audit</h2>
        <p>Request a short review of your mobile page, contact path, and service message. You will get three practical fixes. No purchase required.</p>
        <p>Call our 24/7 AI Assistant at +1 (760) 334-7874 or email hello@phoenixwebsites.ai.</p>
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
          "founder": {
            "@type": "Person",
            "name": "Carter Moyer",
            "url": "https://carter-portfolio.fyi"
          }
        },
        {
          "@type": "WebSite",
          "@id": "https://phoenixwebsites.ai/#website",
          "url": "https://phoenixwebsites.ai",
          "name": "Phoenix Websites AI"
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

  // If specific route schema exists, inject it
  if (route.schema) {
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
