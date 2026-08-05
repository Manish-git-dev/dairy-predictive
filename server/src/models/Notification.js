const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['alert', 'task', 'approval', 'anomaly', 'sla_breach', 'system'] },
  title: String,
  message: String,
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  readAt: Date,
  relatedEntity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
