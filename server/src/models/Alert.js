const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['sla_breach', 'anomaly', 'threshold', 'system'] },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  title: String,
  message: String,
  relatedEntity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
  resolvedAt: Date,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

alertSchema.index({ organization: 1, acknowledged: 1, severity: 1, createdAt: -1 });
alertSchema.index({ organization: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
