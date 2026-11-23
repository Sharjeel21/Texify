// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Lightweight in-memory cache for authenticated users (reduces DB roundtrips on every request)
// 30-second TTL ensures quick invalidation if role or active status changes
const userCache = new Map();
const USER_CACHE_TTL_MS = 30000;

// Periodic cleanup of expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userCache.entries()) {
    if (now - entry.timestamp > USER_CACHE_TTL_MS) {
      userCache.delete(key);
    }
  }
}, 120000).unref(); // unref prevents timer from holding Node process open

// Helper to invalidate user cache on profile updates or deactivation
const invalidateUserCache = (userId) => {
  if (userId) {
    userCache.delete(userId.toString());
  }
};

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user in cache first
    let user = null;
    const cachedEntry = userCache.get(decoded.userId);
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < USER_CACHE_TTL_MS) {
      user = cachedEntry.user;
    } else {
      // Find user with lean projection (only required fields, avoids Mongoose hydration)
      user = await User.findById(decoded.userId)
        .select('_id name email role isActive')
        .lean();

      if (user) {
        userCache.set(decoded.userId, { user, timestamp: now });
      }
    }

    if (!user) {
      userCache.delete(decoded.userId);
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (!user.isActive) {
      userCache.delete(decoded.userId);
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// Check if user is admin or manager
const isAdminOrManager = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied. Admin or Manager privileges required.' 
    });
  }
  next();
};

module.exports = { 
  authenticate, 
  isAdmin, 
  isAdminOrManager,
  invalidateUserCache
};