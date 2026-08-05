const AuditLog = require('../models/AuditLog');
const getPagination = require('../utils/pagination');

const auditService = {
  log: async (action, resource, resourceId, userId, changes, req, organizationId) => {
    const log = new AuditLog({
      organization: organizationId,
      action,
      resource,
      resourceId,
      user: userId,
      changes: changes || {},
      ipAddress: req ? req.ip : undefined,
      userAgent: req ? req.headers['user-agent'] : undefined
    });
    await log.save();
    return log;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, action, resource, user, startDate, endDate } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (user) query.user = user;

    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const items = await AuditLog.find(query).populate('user', 'firstName lastName email').sort({ timestamp: -1 }).skip(skip).limit(limitNum);
    const total = await AuditLog.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getByResource: async (resource, resourceId, organizationId) => {
    return await AuditLog.find({ resource, resourceId, organization: organizationId })
      .populate('user', 'firstName lastName email')
      .sort({ timestamp: -1 });
  }
};

module.exports = auditService;
