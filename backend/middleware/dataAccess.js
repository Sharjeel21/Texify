// backend/middleware/dataAccess.js
const mongoose = require('mongoose');

/**
 * Enterprise-level data access control middleware
 * Ensures users can only access their own data
 */

// ============================================
// Add User to Query Filters
// ============================================
const addUserFilter = (req, res, next) => {
  // Attach userId to request for easy access
  req.userFilter = { user: req.userId };
  next();
};

// ============================================
// Verify Resource Ownership
// ============================================
const verifyOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid resource ID'
        });
      }
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }
      
      // Check if resource belongs to the current user
      if (resource.user.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not own this resource.'
        });
      }
      
      // Attach resource to request
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify resource ownership'
      });
    }
  };
};

// ============================================
// Verify Related Resource Ownership
// ============================================
const verifyRelatedOwnership = (RelatedModel, fieldName) => {
  return async (req, res, next) => {
    try {
      const relatedId = req.body[fieldName] || req.params[fieldName];
      
      if (!relatedId) {
        return next(); // Field not provided, skip check
      }
      
      if (!mongoose.Types.ObjectId.isValid(relatedId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid ${fieldName} ID`
        });
      }
      
      const relatedResource = await RelatedModel.findById(relatedId);
      
      if (!relatedResource) {
        return res.status(404).json({
          success: false,
          error: `${fieldName} not found`
        });
      }
      
      // Check if related resource belongs to the current user
      if (relatedResource.user.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: `Access denied. The specified ${fieldName} does not belong to you.`
        });
      }
      
      next();
    } catch (error) {
      console.error('Related ownership verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify related resource ownership'
      });
    }
  };
};

// ============================================
// Auto-add User ID to Create Operations
// ============================================
const attachUserId = (req, res, next) => {
  // Automatically add user ID to request body for create operations
  if (req.method === 'POST' && req.body) {
    req.body.user = req.userId;
  }
  next();
};

// ============================================
// Prevent User Field Modification
// ============================================
const preventUserModification = (req, res, next) => {
  // Prevent users from changing the 'user' field
  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (req.body.user) {
      delete req.body.user;
    }
  }
  next();
};

// ============================================
// Query Sanitizer - Add User Filter to Queries
// ============================================
const sanitizeQuery = (req, res, next) => {
  // For GET requests, ensure query params don't override user filter
  if (req.query) {
    // Remove any attempts to query other users' data
    delete req.query.user;
    delete req.query._user;
    
    // Add user filter to query
    req.query.user = req.userId;
  }
  next();
};

// ============================================
// Company Settings Special Handler
// ============================================
const handleCompanySettings = async (req, res, next) => {
  // Company settings is one-per-user, handle specially
  req.userFilter = { user: req.userId };
  next();
};

// ============================================
// Bulk Operation Protection
// ============================================
const protectBulkOperations = (req, res, next) => {
  // Prevent bulk delete/update without user filter
  if (req.body && req.body.filter) {
    req.body.filter.user = req.userId;
  }
  next();
};

// ============================================
// Export Middleware
// ============================================
module.exports = {
  addUserFilter,
  verifyOwnership,
  verifyRelatedOwnership,
  attachUserId,
  preventUserModification,
  sanitizeQuery,
  handleCompanySettings,
  protectBulkOperations,
  
  // Convenience combined middleware
  secureCreate: [attachUserId, preventUserModification],
  secureUpdate: [preventUserModification],
  secureRead: [addUserFilter, sanitizeQuery],
  secureDelete: [addUserFilter]
};