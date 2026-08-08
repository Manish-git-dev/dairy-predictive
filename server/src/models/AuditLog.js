const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: String,
  resource: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ organization: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, resource: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, user: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
