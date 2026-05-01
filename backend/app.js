// --- Environment and Dependencies ---
const path = require('path');
const fs = require('fs');
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

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
  frameguard: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// --- MongoDB Connection Logic ---
const mongoURI = process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/^["']|["']$/g, '') : null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!mongoURI) {
    console.warn('WARN: No MONGODB_URI found in environment!');
    return;
  }
  try {
    console.log('INFO: Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    console.log('OK: Connected to MongoDB');
  } catch (err) {
    console.error('ERROR: MongoDB Connection Failed:', err.message);
  }
};

// Initial connection
connectDB();

// --- Session & Passport Setup ---
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'secret',
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
  if (mongoose.connection.readyState === 1) return next();
  if (mongoose.connection.readyState === 0) await connectDB();

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (mongoose.connection.readyState === 1) {
      clearInterval(interval);
      return next();
    }
    if (attempts >= 30) {
      clearInterval(interval);
      return res.status(503).json({
        error: 'Database connection timeout. Please refresh or check MONGODB_URI.'
      });
    }
  }, 100);
};

// --- Routes ---

// 1. Health/Diagnostics (No DB Check required to allow status reporting)
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

// 2. Feature Routes (Apply DB check to these)
const authRouter = require('./routes/auth');
const leadsRouter = require('./routes/leads');
const indexRouter = require('./routes/index');

// Mount routes at both /api and root to handle Vercel routing flexibility
const featureRoutes = [
  { path: '/auth', router: authRouter },
  { path: '/leads', router: leadsRouter },
  { path: '/', router: indexRouter }
];

featureRoutes.forEach(route => {
  // Mount with /api prefix and DB check
  app.use(`/api${route.path}`, dbCheck, route.router);
  // Mount at root as fallback
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
