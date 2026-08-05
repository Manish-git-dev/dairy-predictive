const Alert = require('../models/Alert');
const getPagination = require('../utils/pagination');

const alertService = {
  create: async (data, organizationId) => {
    const alertId = `ALT-${Date.now()}`;
    const alert = new Alert({ ...data, alertId, organization: organizationId });
    await alert.save();
    return alert;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, type, severity, acknowledged } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';

    const items = await Alert.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Alert.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Alert.findOne({ _id: id, organization: organizationId });
  },

  acknowledge: async (id, userId, organizationId) => {
    return await Alert.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { acknowledged: true, acknowledgedBy: userId, acknowledgedAt: new Date() },
      { new: true }
    );
  },

  resolve: async (id, userId, organizationId) => {
    return await Alert.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { resolvedAt: new Date(), resolvedBy: userId },
      { new: true }
    );
  },

  getActiveAlerts: async (organizationId) => {
    return await Alert.find({ organization: organizationId, acknowledged: false }).sort({ createdAt: -1 });
  },

  getAlertCounts: async (organizationId) => {
    const active = await Alert.find({ organization: organizationId, acknowledged: false });
    const counts = { high: 0, medium: 0, low: 0, critical: 0 };
    active.forEach(a => {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    });
    return counts;
  }
};

module.exports = alertService;
