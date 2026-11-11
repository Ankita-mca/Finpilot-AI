/**
 * FinPilot AI - Express Application Setup
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth.routes');
const aiRoutes = require('./src/routes/ai.routes');
const customerRoutes = require('./src/routes/customer.routes');
const invoiceRoutes = require('./src/routes/invoice.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS Configuration for Frontend Integration
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000'
).split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching list
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// 3. Body Parsing & Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);

// 5. Health Check & Root Info Endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'FinPilot AI Autonomous Cashflow Engine Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to FinPilot AI REST API',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
        organization: 'POST /api/auth/organization',
        forgotPassword: 'POST /api/auth/forgot-password',
      },
      ai: {
        query: 'POST /api/ai/query',
        sessions: 'GET /api/ai/sessions',
        createSession: 'POST /api/ai/sessions',
        sessionHistory: 'GET /api/ai/sessions/:sessionId/messages',
        clearSession: 'DELETE /api/ai/sessions/:sessionId/messages',
      },
      customers: {
        create: 'POST /api/customers',
        getAll: 'GET /api/customers',
        getById: 'GET /api/customers/:id',
        update: 'PUT /api/customers/:id',
        delete: 'DELETE /api/customers/:id',
      },
      invoices: {
        create: 'POST /api/invoices',
        getAll: 'GET /api/invoices',
        summary: 'GET /api/invoices/summary',
        nextNumber: 'GET /api/invoices/next-number',
        getById: 'GET /api/invoices/:id',
        update: 'PUT /api/invoices/:id',
        delete: 'DELETE /api/invoices/:id',
      },
    },
  });
});

// 6. 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// 7. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

