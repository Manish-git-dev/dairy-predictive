const mongoose = require('mongoose');

const probability = {
  type: Number,
  required: true,
  min: 0,
  max: 1,
  validate: { validator: Number.isFinite, message: '{PATH} must be a finite number' }
};

const predictionSchema = new mongoose.Schema({
  predictionType: {
    type: String,
    enum: ['quality_risk', 'rejection_probability', 'spoilage_risk', 'capacity_risk'],
    required: true,
    index: true
  },
  entity: {
    type: { type: String, required: true, trim: true },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  inputPeriod: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    days: { type: Number, required: true, min: 1, validate: { validator: Number.isFinite, message: 'inputPeriod.days must be finite' } }
  },
  prediction: probability,
  confidence: probability,
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  modelVersion: { type: String, required: true, trim: true },
  method: { type: String, required: true, trim: true },
  explanation: { type: String, required: true, trim: true },
  recommendedAction: { type: String, required: true, trim: true },
  features: { type: mongoose.Schema.Types.Mixed },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

predictionSchema.index({ organization: 1, predictionType: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
