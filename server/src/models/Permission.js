const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  resource: { type: String, required: true },
  action: { type: String, enum: ['create', 'read', 'update', 'delete'], required: true },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
