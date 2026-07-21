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

// --- MongoDB Connection Logic ---
const mongoURI = process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/^["']|["']$/g, '') : null;

let cachedDbPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!mongoURI) {
    console.warn('WARN: No MONGODB_URI found in environment!');
    return;
  }
  if (!cachedDbPromise) {
    console.log('INFO: Connecting to MongoDB...');
    cachedDbPromise = mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    }).catch(err => {
      cachedDbPromise = null;
      console.error('ERROR: MongoDB Connection Failed:', err.message);
    });
  }
  await cachedDbPromise;
};

// Initial connection
connectDB();

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

  const storeOptions = {
    mongoUrl: mongoURI,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native'
  };

  try {
    if (typeof ActualMongoStore.create === 'function') {
      sessionConfig.store = ActualMongoStore.create(storeOptions);
      console.log('OK: Session Store initialized with MongoStore.create');
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

// --- DB Wait Middleware ---
const dbCheck = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  
  if (mongoose.connection.readyState === 1) {
    return next();
  } else {
    return res.status(503).json({
      error: 'Database connection timeout. Please refresh or check MONGODB_URI.'
    });
  }
};

// --- Routes ---

// 1. Health/Diagnostics & Public Pricing (No DB Check required to allow fast responses)
const healthHandler = async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'online',
    database: isConnected ? 'Connected' : 'Disconnected',
    env: isProd ? 'production' : 'development',
    timestamp: new Date().toISOString()
  });
};
app.get(['/health', '/api/health'], healthHandler);

// Public pricing endpoint (No DB check required)
const pricingHandler = (req, res) => {
  const isTestMode = process.env.TEST_MODE === 'true';
  res.json({
    discountPercentage: isTestMode ? 0 : parseInt(process.env.DISCOUNT_PERCENTAGE || '0'),
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

// Mount routes
const featureRoutes = [
  { path: '/auth', router: authRouter },
  { path: '/leads', router: leadsRouter },
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
app.get('/', (req, res) => {
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
  
  res.status(err.status || 500).json({
    message: err.message,
    error: isProd ? {} : err
  });
});

module.exports = app;
