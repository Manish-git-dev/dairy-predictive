const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  workflowId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  status: { type: String, enum: ['draft', 'pending', 'in_progress', 'blocked', 'completed', 'cancelled'], default: 'draft', index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sla: {
    rule: { type: mongoose.Schema.Types.ObjectId, ref: 'SlaRule' },
    minutes: { type: Number, min: 1 },
    breached: { type: Boolean, default: false },
    breachedAt: Date
  },
  startTime: Date,
  dueTime: Date,
  relatedOperation: { type: String, trim: true, maxlength: 160 },
  notes: { type: String, trim: true, maxlength: 4000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

workflowSchema.index({ organization: 1, status: 1, priority: 1, owner: 1, createdAt: -1 });
workflowSchema.index({ organization: 1, name: 'text', description: 'text', relatedOperation: 'text' });

module.exports = mongoose.model('Workflow', workflowSchema);
