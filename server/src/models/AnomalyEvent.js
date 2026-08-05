const mongoose = require('mongoose');

const anomalyEventSchema = new mongoose.Schema({
  anomalyId: { type: String, required: true, unique: true },
  type: String,
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  description: String,
  detectedAt: Date,
  entity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  metrics: {
    expected: Number,
    actual: Number,
    deviation: Number
  },
  riskScore: { type: Number, min: 0, max: 100 },
  explanation: String,
  factors: [{
    name: String,
    weight: Number,
    value: Number
  }],
  status: { type: String, enum: ['detected', 'investigating', 'resolved', 'false_positive'], default: 'detected' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  resolution: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('AnomalyEvent', anomalyEventSchema);
