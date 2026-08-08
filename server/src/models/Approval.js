const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  approvalId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['ai_recommendation', 'payment', 'anomaly_action', 'task_override', 'quality_override'] },
  title: String,
  description: String,
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'overridden'], default: 'pending' },
  aiRecommendation: {
    action: String,
    confidence: Number,
    reasoning: String,
    modelVersion: String
  },
  overrideReason: String,
  relatedEntity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

approvalSchema.index({ organization: 1, status: 1, createdAt: -1 });
approvalSchema.index({ organization: 1, reviewer: 1, createdAt: -1 });
approvalSchema.index({ organization: 1, requester: 1, createdAt: -1 });

module.exports = mongoose.model('Approval', approvalSchema);
