import { next } from '@vercel/edge';

const KNOWN_STATIC_ROUTES = [
  '/',
  '/services',
  '/services/ai-web-development',
  '/services/full-stack-development',
  '/services/custom-websites',
  '/services/automation',
  '/services/ai-solutions',
  '/data-cleanup',
  '/about',
  '/reviews',
  '/terms',
  '/privacy',
  '/refunds',
];

const KNOWN_SPA_ROUTES = [
  '/dashboard',
  '/checkout',
  '/checkout-success',
  '/growth-crm',
  '/admin-reviews',
  '/leave-review',
];

const REDIRECT_MAP: Record<string, string> = {
  '/home': '/',
  '/custom-websites': '/services/custom-websites',
  '/custom-website-development': '/services/custom-websites',
  '/automation': '/services/automation',
  '/ai-solutions': '/services/ai-solutions',
  '/ai-web-development': '/services/ai-web-development',
  '/ai-development': '/services/ai-web-development',
  '/full-stack-development': '/services/full-stack-development',
  '/full-stack': '/services/full-stack-development',
  '/data': '/data-cleanup',
};

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|_vercel|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle redirects
  if (pathname in REDIRECT_MAP) {
    return Response.redirect(new URL(REDIRECT_MAP[pathname], request.url), 308);
  }

  // Allow known static routes
  if (KNOWN_STATIC_ROUTES.includes(pathname)) {
    return next();
  }

  // Allow known SPA routes
  if (KNOWN_SPA_ROUTES.includes(pathname)) {
    return next();
  }

  // Allow dynamic routes
  if (/^\/leave-review\/[^/]+$/.test(pathname)) {
    return next();
  }
  if (/^\/data\/[^/]+$/.test(pathname)) {
    return next();
  }

  // Return 404 for unknown routes
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Page Not Found | Phoenix Websites AI</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #020205; color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; max-width: 480px; }
    .code { font-size: 6rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: #a1a1aa; margin-bottom: 1.5rem; }
    .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    a { padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; transition: background 0.2s; }
    .primary { background: #ea580c; color: white; }
    .primary:hover { background: #c2410c; }
    .secondary { background: #27272a; color: #f5f5f5; }
    .secondary:hover { background: #3f3f46; }
    .contact { margin-top: 2rem; font-size: 0.875rem; color: #71717a; }
    .contact a { padding: 0; color: #ea580c; text-transform: none; letter-spacing: 0; font-weight: 400; }
  </style>
</head>
<body>
  <div class="container">
    <p class="code">404</p>
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <div class="actions">
      <a href="/" class="primary">Go to Homepage</a>
      <a href="/services" class="secondary">View Services</a>
    </div>
    <p class="contact">Looking for something specific? <a href="mailto:hello@phoenixwebsites.ai">Contact us</a></p>
  </div>
</body>
</html>`,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': 'frame-ancestors *',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    }
  );
}
