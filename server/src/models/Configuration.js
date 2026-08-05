const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  category: { type: String, enum: ['general', 'quality', 'pricing', 'sla', 'notification', 'system'] },
  description: String,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

configurationSchema.index({ organization: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Configuration', configurationSchema);
