const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  resource: { type: String, required: true, trim: true },
  actions: [{
    type: String,
    enum: ['create', 'read', 'update', 'delete']
  }]
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, trim: true, maxlength: 500 },
  permissions: { type: [rolePermissionSchema], default: [] },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
