const mongoose = require('mongoose');
const getPagination = require('../utils/pagination');

// Define Audit schema
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  action: String,
  resource: String,
  resourceId: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String
}, { timestamps: true }));

const auditService = {
  log: async (action, resource, resourceId, userId, changes, req, organizationId) => {
    const log = new AuditLog({
      organization: organizationId,
      action,
      resource,
      resourceId,
      user: userId,
      changes,
      ipAddress: req ? req.ip : undefined,
      userAgent: req ? req.headers['user-agent'] : undefined
    });
    await log.save();
    return log;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, action, resource, user, startDate, endDate } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (user) query.user = user;
    
    if (startDate && endDate) {
       query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const items = await AuditLog.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await AuditLog.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getByResource: async (resource, resourceId, organizationId) => {
    return await AuditLog.find({ resource, resourceId, organization: organizationId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }
};

module.exports = auditService;
