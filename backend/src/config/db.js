/**
 * FinPilot AI - MongoDB Atlas Connection Manager
 */
const mongoose = require('mongoose');

let isInitialConnectionAttempt = true;
let lastErrorMessage = '';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>:<password>')) {
    console.warn('⚠️  MONGODB_URI is not configured in backend/.env.');
    console.warn('👉 Please update backend/.env with your MongoDB Atlas connection string.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    lastErrorMessage = '';
    return conn;
  } catch (error) {
    handleConnectionError(error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // Auto-retry connection every 15 seconds so once IP is whitelisted, it connects automatically
    setTimeout(connectDB, 15000);
    return null;
  }
};

function handleConnectionError(error) {
  const isWhitelistError =
    error.message.includes('whitelist') ||
    error.message.includes('SSL routines') ||
    error.message.includes('tlsv1 alert internal error') ||
    error.message.includes('Could not connect to any servers');

  if (isWhitelistError) {
    if (lastErrorMessage !== 'whitelist') {
      lastErrorMessage = 'whitelist';
      console.error('\n🔴 MONGODB ATLAS CONNECTION BLOCKED:');
      console.error('--------------------------------------------------');
      console.error('MongoDB Atlas is rejecting the connection because your current IP');
      console.error('address is not in the Atlas Network Access whitelist.');
      console.error('\n🛠️  HOW TO FIX IN 30 SECONDS:');
      console.error('1. Open your MongoDB Atlas Console: https://cloud.mongodb.com/');
      console.error('2. In the left sidebar, click "Network Access" (under Security).');
      console.error('3. Click "+ ADD IP ADDRESS".');
      console.error('4. Choose "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0) or "Add Current IP Address".');
      console.error('5. Click "Confirm". (Changes take ~30 seconds to apply).');
      console.error('--------------------------------------------------\n');
    }
  } else {
    if (lastErrorMessage !== error.message) {
      lastErrorMessage = error.message;
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  // Suppress repetitive noisy logs
});

mongoose.connection.on('error', (err) => {
  handleConnectionError(err);
});

module.exports = connectDB;
