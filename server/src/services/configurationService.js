const Configuration = require('../models/Configuration');

const configurationService = {
  getAll: async (organizationId, category) => {
    const query = { organization: organizationId };
    if (category) query.category = category;
    return await Configuration.find(query).sort({ category: 1, key: 1 });
  },

  get: async (key, organizationId) => {
    return await Configuration.findOne({ key, organization: organizationId });
  },

  set: async (key, value, category, description, userId, organizationId) => {
    return await Configuration.findOneAndUpdate(
      { key, organization: organizationId },
      { value, category, description, updatedBy: userId },
      { new: true, upsert: true }
    );
  },

  delete: async (key, organizationId) => {
    return await Configuration.findOneAndDelete({ key, organization: organizationId });
  },

  getBulk: async (keys, organizationId) => {
    return await Configuration.find({ key: { $in: keys }, organization: organizationId });
  }
};

module.exports = configurationService;
