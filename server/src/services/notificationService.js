const Notification = require('../models/Notification');
const getPagination = require('../utils/pagination');

const notificationService = {
  create: async (data, organizationId) => {
    const notification = new Notification({ ...data, organization: organizationId });
    await notification.save();
    return notification;
  },

  getAll: async (userId, organizationId, filters = {}) => {
    const { page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId, recipient: userId };

    const items = await Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
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

  notify: async (recipientId, type, title, message, relatedEntity, organizationId) => {
    return await notificationService.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedEntity
    }, organizationId);
  }
};

module.exports = notificationService;
