const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

dotenv.config();

const app = express();

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'https://rqb7lw1w-3000.inc1.devtunnels.ms',
  'https://rqb7lw1w-5000.inc1.devtunnels.ms',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================
// Middleware
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// MongoDB Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// Import and Mount Routes
// ============================================
app.use('/api/company-settings', require('./routes/companySettings'));
app.use('/api/qualities', require('./routes/quality'));
app.use('/api/parties', require('./routes/party'));
app.use('/api/delivery-challans', require('./routes/deliveryChallan'));
app.use('/api/deals', require('./routes/deal')); // ✅ NEW: Deal routes
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
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Error Handlers
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.url);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;

// Get local IP address for network access
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
  console.log('========================================');
});

module.exports = app;