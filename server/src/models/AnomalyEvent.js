const mongoose = require('mongoose');

const anomalyEventSchema = new mongoose.Schema({
  anomalyId: { type: String, required: true, unique: true },
  type: { type: String, index: true },
  metric: { type: String, index: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  description: String,
  detectedAt: { type: Date, index: true },
  entity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId,
    label: String
  },
  metrics: {
    expected: Number,
    actual: Number,
    deviation: Number
  },
  actualValue: Number,
  expectedRange: { min: Number, max: Number, label: String },
  riskScore: { type: Number, min: 0, max: 100 },
  explanation: String,
  recommendedAction: String,
  factors: [{
    name: String,
    weight: Number,
    value: Number
  }],
  status: { type: String, enum: ['detected', 'investigating', 'resolved', 'false_positive'], default: 'detected', index: true },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  resolution: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

anomalyEventSchema.index({ organization: 1, detectedAt: -1 });
anomalyEventSchema.index({ organization: 1, metric: 1, status: 1 });

module.exports = mongoose.model('AnomalyEvent', anomalyEventSchema);
