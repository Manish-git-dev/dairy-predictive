const mongoose = require('mongoose');
const { WORKFLOW_STAGES } = require('../utils/constants');

const operationalEventSchema = new mongoose.Schema({
  eventType: String,
  stage: { type: String, enum: WORKFLOW_STAGES },
  description: String,
  entity: {
    type: { type: String },
    id: mongoose.Schema.Types.ObjectId
  },
  metrics: mongoose.Schema.Types.Mixed,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('OperationalEvent', operationalEventSchema);
