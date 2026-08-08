const mongoose = require('mongoose');

const triggerSchema = new mongoose.Schema({
  triggeredAt: { type: Date, default: Date.now },
  value: Number,
  threshold: Number,
  operator: String,
  matched: { type: Boolean, default: false },
  action: String,
  approvalId: String,
  approvalStatus: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'not_required' },
  evaluationWindowHours: Number
}, { _id: false });

const preventiveRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  metric: { type: String, required: true, index: true },
  operator: { type: String, enum: ['>', '>=', '<', '<=', '=', '!='], required: true },
  threshold: { type: Number, required: true, finite: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  action: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enabled: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastTriggered: Date,
  evaluationWindowHours: { type: Number, min: 1, max: 720, default: 24 },
  triggerHistory: { type: [triggerSchema], default: [] },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

preventiveRuleSchema.index({ organization: 1, enabled: 1, metric: 1 });
preventiveRuleSchema.index({ organization: 1, lastTriggered: -1 });

module.exports = mongoose.model('PreventiveRule', preventiveRuleSchema);
