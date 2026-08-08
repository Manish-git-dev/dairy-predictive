const mongoose = require('mongoose');

const reportRunSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['daily_operations', 'collection', 'quality', 'production', 'inventory', 'payments', 'anomalies', 'forecast', 'prediction'],
    required: true,
    index: true
  },
  format: { type: String, enum: ['preview', 'csv'], default: 'preview' },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'running', index: true },
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  metadata: {
    title: String,
    startDate: Date,
    endDate: Date,
    generatedAt: Date,
    completedAt: Date,
    recordCount: { type: Number, default: 0 },
    previewCount: { type: Number, default: 0 }
  },
  error: String
}, { timestamps: true });

reportRunSchema.index({ organization: 1, createdAt: -1 });
reportRunSchema.index({ organization: 1, requestedBy: 1, createdAt: -1 });

module.exports = mongoose.model('ReportRun', reportRunSchema);
