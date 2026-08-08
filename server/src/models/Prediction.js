const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  predictionType: {
    type: String,
    enum: ['quality_risk', 'rejection_probability', 'spoilage_risk', 'capacity_risk'],
    required: true,
    index: true
  },
  entity: {
    type: { type: String, required: true },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  inputPeriod: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    days: { type: Number, required: true }
  },
  prediction: { type: Number, required: true, min: 0, max: 1 },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  modelVersion: { type: String, required: true },
  method: { type: String, required: true },
  explanation: { type: String, required: true },
  recommendedAction: { type: String, required: true },
  features: { type: mongoose.Schema.Types.Mixed },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

predictionSchema.index({ organization: 1, predictionType: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
