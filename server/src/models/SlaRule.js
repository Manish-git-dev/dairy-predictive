const mongoose = require('mongoose');
const { WORKFLOW_STAGES } = require('../utils/constants');

const slaRuleSchema = new mongoose.Schema({
  name: String,
  description: String,
  stage: { type: String, enum: WORKFLOW_STAGES },
  metric: String,
  threshold: Number,
  unit: String,
  escalationTime: Number, // minutes
  escalationRole: String,
  notifyRoles: [String],
  isActive: { type: Boolean, default: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('SlaRule', slaRuleSchema);
