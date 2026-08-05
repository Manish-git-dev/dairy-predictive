const Approval = require('../models/Approval');
const getPagination = require('../utils/pagination');

const approvalService = {
  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status, type } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (status) query.status = status;
    if (type) query.type = type;

    const items = await Approval.find(query).skip(skip).limit(limitNum);
    const total = await Approval.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Approval.findOne({ _id: id, organization: organizationId });
  },

  getPending: async (organizationId) => {
    return await Approval.find({ organization: organizationId, status: 'pending' });
  },

  review: async (id, status, overrideReason, userId, organizationId) => {
    const approval = await Approval.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status, overrideReason, reviewer: userId, reviewedAt: new Date() },
      { new: true }
    );
    
    if (approval && status === 'approved') {
       // Mock executing the action
       console.log(`Executed action for approval ${id}`);
    }
    
    // Create Audit log here if AuditService was available (it will be created in another group)
    return approval;
  },

  getMyApprovals: async (userId, organizationId) => {
    // approvals assigned to this user to review
    return await Approval.find({ organization: organizationId, reviewer: userId });
  }
};

module.exports = approvalService;
