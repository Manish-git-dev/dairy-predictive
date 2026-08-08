const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound } = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const requestContext = require('./middleware/requestContext');

const app = express();

// Correlate every request with a safe identifier for client/server troubleshooting.
app.use(requestContext);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

// Global rate limiting
app.use(rateLimiter(100, 15));

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
