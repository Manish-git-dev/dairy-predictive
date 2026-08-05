const Approval = require('../models/Approval');
const AuditLog = require('../models/AuditLog');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const approvalService = {
  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status, type } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;
    if (type) query.type = type;

    const items = await Approval.find(query).populate('requester reviewer relatedEntity.id').sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await Approval.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const approval = await Approval.findOne({ _id: id, organization: organizationId }).populate('requester reviewer');
    if (!approval) throw new ApiError(404, 'Approval not found');
    return approval;
  },

  getPending: async (organizationId) => {
    return await Approval.find({ organization: organizationId, status: 'pending' }).sort({ createdAt: -1 });
  },

  review: async (id, body, userId, organizationId) => {
    const { status, comments } = body;
    const existing = await Approval.findOne({ _id: id, organization: organizationId });
    if (!existing) throw new ApiError(404, 'Approval not found');

    const updateData = { status, reviewer: userId, reviewedAt: new Date() };
    if (status === 'overridden' && comments) updateData.overrideReason = comments;
    if (status === 'overridden' && body.overrideReason) updateData.overrideReason = body.overrideReason;

    const approval = await Approval.findOneAndUpdate(
      { _id: id, organization: organizationId },
      updateData,
      { new: true }
    );

    await new AuditLog({
      organization: organizationId,
      action: 'review',
      resource: 'Approval',
      resourceId: approval._id,
      user: userId,
      changes: { before: { status: existing.status }, after: { status, comments } }
    }).save();

    return approval;
  },

  getMyApprovals: async (userId, organizationId) => {
    return await Approval.find({ organization: organizationId, reviewer: userId }).sort({ createdAt: -1 });
  }
};

module.exports = approvalService;
