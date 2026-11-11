/**
 * FinPilot AI - Server Entry Point
 */
require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (non-blocking in dev mode)
connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 FinPilot AI Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Assistant API: http://localhost:${PORT}/api/ai/query`);
});

// Graceful error & rejection handlers
process.on('uncaughtException', (err) => {
  console.error(`💥 Uncaught Exception: ${err.message}`);
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  // Keep alive in development, exit in production
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

module.exports = server;

