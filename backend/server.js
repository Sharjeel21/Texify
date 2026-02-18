//backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ============================================
// Environment-based CORS Configuration
// ============================================
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'http://localhost:3000',
  'https://rqb7lw1w-3000.inc1.devtunnels.ms',
  'https://rqb7lw1w-5000.inc1.devtunnels.ms',
  'https://texify-sh.vercel.app',
  'https://texify-sh-git-main-sharjeels-projects-cddc3df4.vercel.app',
];

// ============================================
// CORS Middleware
// ============================================
app.use(cors({
  origin: function (origin, callback) {
    // ✅ In development, allow all origins
    if (!isProduction) {
      return callback(null, true);
    }

    // ✅ Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // ✅ In production, check whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(`❌ Blocked CORS request from: ${origin}`);
    const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
    callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ✅ Handle preflight requests
app.options(/.*/, cors());

// ============================================
// Middleware
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Request Logging (Development only)
// ============================================
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// ============================================
// MongoDB Connection (Serverless-friendly)
// ============================================
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    isConnected = false;
    throw err; // Don't use process.exit() in serverless
  }
};

// Connect to DB before each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      message: isProduction ? 'Please try again later' : error.message
    });
  }
});

// ============================================
// Import and Mount Routes
// ============================================
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/company-settings', require('./routes/companySettings'));
  app.use('/api/qualities', require('./routes/quality'));
  app.use('/api/parties', require('./routes/party'));
  app.use('/api/delivery-challans', require('./routes/deliveryChallan'));
  app.use('/api/deals', require('./routes/deal'));
  app.use('/api/tax-invoices', require('./routes/taxInvoice'));
  app.use('/api/stock', require('./routes/stock'));
  app.use('/api/purchases', require('./routes/purchase'));
  app.use('/api/purchase-deliveries', require('./routes/purchaseDelivery'));
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Root Route
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'Texify API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      docs: 'See documentation for available routes'
    }
  });
});

// ============================================
// Error Handlers
// ============================================

// 404 Handler
app.use((req, res, next) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const errorResponse = {
    error: 'Something went wrong!',
    message: isProduction ? 'Internal server error' : err.message
  };
  
  res.status(err.status || 500).json(errorResponse);
});

// ============================================
// Export for Vercel (Serverless)
// ============================================
module.exports = app;

// ============================================
// Local Development Server
// ============================================
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Local: http://localhost:${PORT}`);
      console.log('🔐 Authentication: Enabled');
      console.log('🌍 Environment: Development');
      console.log('========================================');
    });
  }).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
}