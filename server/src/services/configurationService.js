const mongoose = require('mongoose');

// Define generic schema if missing
const Config = mongoose.models.Config || mongoose.model('Config', new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  category: String,
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));

const configurationService = {
  getAll: async (organizationId, category) => {
    const query = { organization: organizationId };
    if (category) query.category = category;
    return await Config.find(query);
  },

  get: async (key, organizationId) => {
    return await Config.findOne({ key, organization: organizationId });
  },

  set: async (key, value, category, description, userId, organizationId) => {
    return await Config.findOneAndUpdate(
      { key, organization: organizationId },
      { value, category, description, updatedBy: userId },
      { new: true, upsert: true }
    );
  },

  delete: async (key, organizationId) => {
    return await Config.findOneAndDelete({ key, organization: organizationId });
  },

  getBulk: async (keys, organizationId) => {
    return await Config.find({ key: { $in: keys }, organization: organizationId });
  }
};

module.exports = configurationService;
