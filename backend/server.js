//backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

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
  'https://texify-sh.vercel.app',  // ✅ Your frontend Vercel URL
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
app.options('*', cors());

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
// MongoDB Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// ============================================
// Import and Mount Routes
// ============================================

// 🔐 Authentication Routes (Public - No auth required)
app.use('/api/auth', require('./routes/auth'));

// 📊 Application Routes (Protected)
app.use('/api/company-settings', require('./routes/companySettings'));
app.use('/api/qualities', require('./routes/quality'));
app.use('/api/parties', require('./routes/party'));
app.use('/api/delivery-challans', require('./routes/deliveryChallan'));
app.use('/api/deals', require('./routes/deal'));
app.use('/api/tax-invoices', require('./routes/taxInvoice'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/purchases', require('./routes/purchase'));
app.use('/api/purchase-deliveries', require('./routes/purchaseDelivery'));

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
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
  
  // Don't leak error details in production
  const errorResponse = {
    error: 'Something went wrong!',
    message: isProduction ? 'Internal server error' : err.message
  };
  
  res.status(err.status || 500).json(errorResponse);
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;

// Only get local IP in development
if (!isProduction) {
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';

  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((interfaceInfo) => {
      if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
        localIP = interfaceInfo.address;
      }
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${localIP}:${PORT}`);
    console.log('🔐 Authentication: Enabled');
    console.log('🌍 Environment: Development');
    console.log('========================================');
  });
} else {
  // Production (Vercel handles the server binding)
  app.listen(PORT, () => {
    console.log('========================================');
    console.log(`🚀 Production Server Started`);
    console.log(`🔐 Authentication: Enabled`);
    console.log(`🌍 Environment: Production`);
    console.log('========================================');
  });
}

module.exports = app;
