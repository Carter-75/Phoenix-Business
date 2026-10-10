export const config = {
  matcher: ['/((?!api|_vercel|.*\\..*).*)'],
};

const KNOWN_PATHS = new Set([
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
  '/dashboard',
  '/checkout',
  '/checkout-success',
  '/growth-crm',
  '/admin-reviews',
  '/leave-review',
]);

const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Page Not Found | Phoenix Websites AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="The page you're looking for doesn't exist or has been moved.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: #020617; 
      color: #fff; 
      font-family: Inter, system-ui, -apple-system, sans-serif;
      padding: 24px;
    }
    .container { text-align: center; max-width: 480px; }
    .code { font-size: 7rem; font-weight: 800; color: #ea580c; line-height: 1; margin-bottom: 8px; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 12px; }
    p { color: #94a3b8; margin-bottom: 24px; font-size: 1rem; }
    .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn { 
      display: inline-block; 
      padding: 12px 24px; 
      border-radius: 8px; 
      text-decoration: none; 
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .btn-primary { background: #ea580c; color: white; }
    .btn-primary:hover { background: #dc2626; }
    .btn-secondary { background: #1e293b; color: #f1f5f9; border: 1px solid #334155; }
    .btn-secondary:hover { background: #334155; }
    .help { margin-top: 32px; font-size: 0.875rem; color: #64748b; }
    .help a { color: #ea580c; text-decoration: none; }
    .help a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <p class="code">404</p>
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <div class="buttons">
      <a href="/" class="btn btn-primary">Go to Homepage</a>
      <a href="/services" class="btn btn-secondary">View Services</a>
    </div>
    <p class="help">Looking for something specific? <a href="mailto:hello@phoenixwebsites.ai">Contact us</a></p>
  </div>
</body>
</html>`;

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Allow known exact paths
  if (KNOWN_PATHS.has(pathname)) {
    return;
  }

  // Allow dynamic routes
  if (/^\/leave-review\/[^/]+$/.test(pathname)) {
    return;
  }
  if (/^\/data\/[^/]+$/.test(pathname)) {
    return;
  }

  // Return 404 for unknown paths
  return new Response(notFoundHtml, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': 'frame-ancestors *',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
