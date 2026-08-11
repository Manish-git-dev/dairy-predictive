const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const getPagination = require('../utils/pagination');

const notificationService = {
  create: async (data, organizationId) => {
    const severity = data.severity || (data.priority === 'high' ? 'high' : data.priority || 'medium');
    const notification = new Notification({ ...data, severity, organization: organizationId });
    await notification.save();
    return notification;
  },

  getAll: async (userId, organizationId, filters = {}) => {
    const { page = 1, limit = 50, read, severity, type, since } = filters;
    const { skip, limit: limitNum } = getPagination(page, Math.min(Number(limit) || 50, 100));
    const query = { organization: organizationId, recipient: userId };

    if (read !== undefined && read !== '') query.read = read === true || read === 'true';
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        query.createdAt = mongoose.trusted({ $gt: sinceDate });
      }
    }

    const items = await Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
    const total = await Notification.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getUnreadCount: async (userId, organizationId) => {
    return await Notification.countDocuments({ organization: organizationId, recipient: userId, read: false });
  },

  markRead: async (id, userId, organizationId) => {
    return await Notification.findOneAndUpdate(
      { _id: id, recipient: userId, organization: organizationId },
      { read: true, readAt: new Date() },
      { new: true }
    );
  },

  markAllRead: async (userId, organizationId) => {
    return await Notification.updateMany(
      { recipient: userId, organization: organizationId, read: false },
      { read: true, readAt: new Date() }
    );
  },

  delete: async (id, userId, organizationId) => {
    return await Notification.findOneAndDelete({ _id: id, recipient: userId, organization: organizationId });
  },

  notify: async (recipientId, type, title, message, relatedEntity, organizationId, options = {}) => {
    return await notificationService.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedEntity,
      severity: options.severity || 'medium',
      priority: options.priority || (options.severity === 'critical' ? 'high' : 'medium')
    }, organizationId);
  }
};

module.exports = notificationService;
