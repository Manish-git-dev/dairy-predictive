const mongoose = require('mongoose');

const aiRunSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['explanation', 'recommendation', 'risk_score', 'forecast'] },
  modelVersion: { type: String, default: '1.0.0' },
  input: {
    type: { type: String },
    snapshot: mongoose.Schema.Types.Mixed
  },
  output: {
    result: mongoose.Schema.Types.Mixed,
    confidence: Number,
    reasoning: String
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  executionTimeMs: Number,
  tokenUsage: {
    prompt: Number,
    completion: Number
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('AiRun', aiRunSchema);
