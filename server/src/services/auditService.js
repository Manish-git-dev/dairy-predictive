const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const getPagination = require('../utils/pagination');

const toValidDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
};

const auditService = {
  log: async (action, resource, resourceId, userId, changes, req, organizationId) => {
    const log = new AuditLog({
      organization: organizationId,
      action,
      resource,
      resourceId: mongoose.isValidObjectId(resourceId) ? resourceId : undefined,
      user: mongoose.isValidObjectId(userId) ? userId : undefined,
      changes: changes || {},
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      timestamp: new Date()
    });
    await log.save();
    return log;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, action, resource, user, actorSearch, startDate, endDate } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    const query = { organization: organizationId };

    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (user && mongoose.isValidObjectId(user)) query.user = user;

    if (actorSearch) {
      const escaped = String(actorSearch).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      const matchingUsers = await User.find({
        organization: organizationId,
        $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }]
      }).select('_id').limit(100).lean();
      query.user = { $in: matchingUsers.map((item) => item._id) };
    }

    const start = toValidDate(startDate);
    const end = toValidDate(endDate, true);
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = start;
      if (end) query.timestamp.$lte = end;
    }

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: limitNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1)
    };
  },

  getByResource: async (resource, resourceId, organizationId) => {
    return AuditLog.find({ resource, resourceId, organization: organizationId })
      .populate('user', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .lean();
  }
};

module.exports = auditService;
