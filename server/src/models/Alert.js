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

module.exports = mongoose.model('Alert', alertSchema);
