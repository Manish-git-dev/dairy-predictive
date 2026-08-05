const SlaRule = require('../models/SlaRule');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const slaRuleService = {
  create: async (data, organizationId) => {
    const rule = new SlaRule({ ...data, organization: organizationId });
    await rule.save();
    return rule;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, stage, isActive } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (stage) query.stage = stage;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const items = await SlaRule.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await SlaRule.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const rule = await SlaRule.findOne({ _id: id, organization: organizationId });
    if (!rule) throw new ApiError(404, 'SLA rule not found');
    return rule;
  },

  update: async (id, data, organizationId) => {
    const rule = await SlaRule.findOneAndUpdate(
      { _id: id, organization: organizationId },
      data,
      { new: true, runValidators: true }
    );
    if (!rule) throw new ApiError(404, 'SLA rule not found');
    return rule;
  },

  delete: async (id, organizationId) => {
    const rule = await SlaRule.findOneAndDelete({ _id: id, organization: organizationId });
    if (!rule) throw new ApiError(404, 'SLA rule not found');
    return rule;
  }
};

module.exports = slaRuleService;
