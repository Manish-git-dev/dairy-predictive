const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound } = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const requestContext = require('./middleware/requestContext');

const app = express();

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(requestContext);

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.URLENCODED_BODY_LIMIT || '100kb' }));

const configuredClientUrl = process.env.CLIENT_URL;
const allowedOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (origin === configuredClientUrl) return callback(null, true);
  return callback(null, false);
};

if (process.env.NODE_ENV === 'production' && !configuredClientUrl) {
  throw new Error('CLIENT_URL environment variable is required in production');
}

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  maxAge: 600
}));

app.use(rateLimiter(100, 15));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
