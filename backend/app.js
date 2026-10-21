// --- Environment and Dependencies ---
const path = require('path');
const fs = require('fs');

// Set custom DNS resolvers only in local development if needed, never in serverless (Vercel/AWS Lambda)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  try {
    const dns = require('node:dns');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore DNS override errors
  }
}

const resolveEnvPath = () => {
  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), 'backend', '.env.local'),
    path.join(__dirname, '../.env.local')
  ];
  for (const c of candidates) { if (fs.existsSync(c)) return c; }
  return null;
};
const envPath = resolveEnvPath();
if (envPath) require('dotenv').config({ path: envPath });
else require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');

const app = express();

// --- Configuration ---
const isProd = process.env.PRODUCTION === 'true' || process.env.VERCEL === '1';
const PROJECT_NAME = process.env.PROJECT_NAME || 'Phoenix-Business';

// Trust proxy for secure cookies on Vercel
if (isProd) {
  app.set('trust proxy', 1);
}

// --- Middlewares (Basics) ---
app.use(helmet({
  frameguard: false
}));

app.use(cors({
  origin: [process.env.PROD_FRONTEND_URL || 'https://phoenixwebsites.ai', 'http://localhost:4200'],
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// --- MongoDB Connection Logic (Serverless-Hardened) ---
const mongoURI = process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/^["']|["']$/g, '') : null;

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  retryReads: true,
  bufferCommands: false
};

const MAX_CONNECT_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectDB = async () => {
  if (!mongoURI) {
    console.warn('WARN: No MONGODB_URI found in environment!');
    return;
  }

  const readyState = mongoose.connection.readyState;
  if (readyState === 1) return;

  if (readyState === 2) {
    if (globalThis.__mongoConnectionPromise) {
      await globalThis.__mongoConnectionPromise;
      return;
    }
  }

  if (readyState === 0 || readyState === 3) {
    globalThis.__mongoConnectionPromise = null;
  }

  if (!globalThis.__mongoConnectionPromise) {
    globalThis.__mongoConnectionPromise = (async () => {
      let lastError = null;
      for (let attempt = 0; attempt < MAX_CONNECT_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            const delay = RETRY_DELAYS[attempt - 1] || 4000;
            console.log(`INFO: Retrying MongoDB connection in ${delay}ms (attempt ${attempt + 1}/${MAX_CONNECT_RETRIES})`);
            await sleep(delay);
          } else {
            console.log('INFO: Connecting to MongoDB...');
          }

          await mongoose.connect(mongoURI, MONGO_OPTIONS);
          console.log('OK: MongoDB connected successfully');
          return;
        } catch (err) {
          lastError = err;
          console.error(`ERROR: MongoDB connection attempt ${attempt + 1} failed: ${err.message}`);
        }
      }

      globalThis.__mongoConnectionPromise = null;
      throw lastError;
    })();
  }

  await globalThis.__mongoConnectionPromise;
};

const ensureConnected = async () => {
  const readyState = mongoose.connection.readyState;
  if (readyState === 1) return true;

  if (readyState === 0 || readyState === 3) {
    globalThis.__mongoConnectionPromise = null;
  }

  try {
    await connectDB();
    return mongoose.connection.readyState === 1;
  } catch (err) {
    return false;
  }
};

// Initial connection and coupon sync (non-blocking startup)
(async () => {
  try {
    const connected = await ensureConnected();
    if (connected) {
      const Coupon = require('./models/Coupon');
      const { syncDatabaseCoupons } = require('./services/pricing.service');
      if (Coupon && typeof Coupon.seedDefaultCoupons === 'function') {
        await Coupon.seedDefaultCoupons();
      }
      const activeCoupons = await Coupon.find({ enabled: true });
      syncDatabaseCoupons(activeCoupons);
    }
  } catch (err) {
    // Non-fatal if DB connection fails in local/test environments
  }
})();

// --- Session & Passport Setup ---
if (!process.env.SESSION_SECRET) {
    console.error('CRITICAL: SESSION_SECRET is missing from environment variables!');
    throw new Error("SESSION_SECRET is required to secure user sessions.");
}

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  }
};

if (mongoURI) {
  let ActualMongoStore = MongoStore;
  if (MongoStore.default) ActualMongoStore = MongoStore.default;

  const getMongoClient = async () => {
    await ensureConnected();
    return mongoose.connection.getClient();
  };

  const storeOptions = {
    clientPromise: getMongoClient(),
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native'
  };

  try {
    if (typeof ActualMongoStore.create === 'function') {
      sessionConfig.store = ActualMongoStore.create(storeOptions);
      console.log('OK: Session Store initialized with MongoStore.create (clientPromise)');
    } else {
      sessionConfig.store = new ActualMongoStore(storeOptions);
      console.log('OK: Session Store initialized with new MongoStore (fallback)');
    }
  } catch (err) {
    console.error('CRITICAL: Failed to initialize Session Store:', err.message);
  }
}

app.use(session(sessionConfig));

// Passport Initialization
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// --- DB Connection Middleware (Blocks until connected for serverless reliability) ---
const dbCheck = async (req, res, next) => {
  try {
    const connected = await ensureConnected();
    if (!connected) {
      console.error('[DB Check] Failed to establish database connection');
      return res.status(503).json({
        error: 'Database temporarily unavailable',
        message: 'Please try again in a moment'
      });
    }
    next();
  } catch (err) {
    console.error('[DB Check] Connection error:', err.message);
    return res.status(503).json({
      error: 'Database temporarily unavailable',
      message: 'Please try again in a moment'
    });
  }
};

// --- Routes ---

// 1. Health/Diagnostics & Public Pricing
const healthHandler = async (req, res) => {
  let dbStatus = 'Disconnected';
  let dbLatencyMs = null;

  try {
    const start = Date.now();
    const connected = await ensureConnected();

    if (connected && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - start;
      dbStatus = 'Connected';
    }
  } catch (err) {
    console.warn('[Health] Database check failed:', err.message);
    dbStatus = 'Disconnected';
  }

  const statusCode = dbStatus === 'Connected' ? 200 : 503;
  res.status(statusCode).json({
    status: dbStatus === 'Connected' ? 'healthy' : 'degraded',
    database: dbStatus,
    dbLatencyMs,
    env: isProd ? 'production' : 'development',
    timestamp: new Date().toISOString()
  });
};
app.get(['/health', '/api/health'], healthHandler);

// Public pricing endpoint (No DB check required)
const pricingHandler = (req, res) => {
  const isTestMode = process.env.TEST_MODE === 'true';
  const { getActivePromotion } = require('./services/promotion.service');
  const activePromo = getActivePromotion();
  const legacyEnvDiscount = isTestMode ? 0 : parseInt(process.env.DISCOUNT_PERCENTAGE || '0', 10);
  const effectiveDiscount = isTestMode ? 0 : Math.max(activePromo.discountPercent || 0, legacyEnvDiscount);

  res.json({
    discountPercentage: effectiveDiscount,
    activePromotion: {
      id: activePromo.id,
      name: activePromo.name,
      displayName: activePromo.displayName,
      discountPercent: activePromo.discountPercent,
      bannerText: activePromo.bannerText,
      theme: activePromo.theme
    },
    basePrices: {
      simple_setup: isTestMode ? 100 : parseInt(process.env.PRICE_SIMPLE_SETUP || '149900'),
      simple_monthly: isTestMode ? 100 : parseInt(process.env.PRICE_SIMPLE_MONTHLY || '9900'),
      essential_setup: isTestMode ? 200 : parseInt(process.env.PRICE_ESSENTIAL_SETUP || '349900'),
      essential_monthly: isTestMode ? 200 : parseInt(process.env.PRICE_ESSENTIAL_MONTHLY || '29900'),
      professional_setup: isTestMode ? 300 : parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '799900'),
      professional_monthly: isTestMode ? 300 : parseInt(process.env.PRICE_PROFESSIONAL_MONTHLY || '59900'),
      enterprise_setup: isTestMode ? 400 : parseInt(process.env.PRICE_ENTERPRISE_SETUP || '1499900'),
      enterprise_monthly: isTestMode ? 400 : parseInt(process.env.PRICE_ENTERPRISE_MONTHLY || '99900'),
      data: isTestMode ? 100 : parseInt(process.env.PRICE_DATA || '24900')
    }
  });
};
app.get(['/stripe/pricing', '/api/stripe/pricing'], pricingHandler);

// 2. Feature Routes (Apply DB check to these)
const authRouter = require('./routes/auth');
const leadsRouter = require('./routes/leads');
const stripeRouter = require('./routes/stripe');
const indexRouter = require('./routes/index');
const cronRouter = require('./routes/cron');
const reviewsRouter = require('./routes/reviews');
const botRouter = require('./routes/bot');
const pricingRouter = require('./routes/pricing');
const promotionsRouter = require('./routes/promotions');
const adminRouter = require('./routes/admin');

const contractsRouter = require('./routes/contracts');
const groupBuyRouter = require('./routes/group-buy');

// Mount routes
const featureRoutes = [
  { path: '/auth', router: authRouter },
  { path: '/admin', router: adminRouter },
  { path: '/contracts', router: contractsRouter },
  { path: '/group-buy', router: groupBuyRouter },
  { path: '/leads', router: leadsRouter },
  { path: '/pricing', router: pricingRouter },
  { path: '/promotions', router: promotionsRouter },
  { path: '/stripe', router: stripeRouter },
  { path: '/cron', router: cronRouter },
  { path: '/reviews', router: reviewsRouter },
  { path: '/bot', router: botRouter },
  { path: '/data-portal', router: require('./routes/data-portal') },
  { path: '/', router: indexRouter }
];

featureRoutes.forEach(route => {
  // Mount with /api prefix for local dev and full paths
  app.use(`/api${route.path}`, dbCheck, route.router);
  // Mount at root for Vercel experimentalServices which strips routePrefix
  app.use(route.path, dbCheck, route.router);
});

// --- Final Handling ---

// Root welcome
app.get(['/', '/api'], (req, res) => {
  res.send(`API for ${PROJECT_NAME} is running`);
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  if (!isProd) console.error(err.stack);
  
  // For OAuth callback routes, redirect to frontend with error instead of returning JSON
  const isOAuthCallback = req.path.includes('/auth/google/callback') || 
                          req.path.includes('/auth/callback');
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  
  if (isOAuthCallback || (acceptsHtml && req.method === 'GET' && req.path.startsWith('/auth/'))) {
    const frontendUrl = process.env.PROD_FRONTEND_URL || 'http://localhost:4200';
    const errorMsg = encodeURIComponent('Something went wrong. Please try again.');
    return res.redirect(`${frontendUrl}/services?auth_error=${errorMsg}`);
  }
  
  res.status(err.status || 500).json({
    message: err.message,
    error: isProd ? {} : err
  });
});

module.exports = app;
