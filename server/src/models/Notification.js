const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['alert', 'task', 'approval', 'anomaly', 'sla_breach', 'workflow', 'preventive_action', 'prediction', 'forecast', 'system'],
    default: 'system'
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  read: { type: Boolean, default: false, index: true },
  readAt: Date,
  relatedEntity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

notificationSchema.index({ organization: 1, recipient: 1, createdAt: -1 });
notificationSchema.index({ organization: 1, recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
