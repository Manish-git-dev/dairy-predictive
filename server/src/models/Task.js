const mongoose = require('mongoose');
const { WORKFLOW_STAGES } = require('../utils/constants');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'operational' },
  stage: { type: String, enum: WORKFLOW_STAGES },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'], default: 'pending' },
  dueDate: Date,
  completedAt: Date,
  slaRule: { type: mongoose.Schema.Types.ObjectId, ref: 'SlaRule' },
  slaBreached: { type: Boolean, default: false },
  escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalatedAt: Date,
  escalationReason: String,
  relatedEntity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  notes: [{
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date
  }],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

taskSchema.index({ organization: 1, status: 1, priority: 1, dueDate: 1 });
taskSchema.index({ organization: 1, assignedTo: 1 });
taskSchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
