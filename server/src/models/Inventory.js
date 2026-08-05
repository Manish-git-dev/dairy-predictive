const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  quantity: Number,
  unit: String,
  location: String,
  expiryDate: Date,
  status: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock', 'expired'], default: 'in_stock' },
  minimumStock: Number,
  reorderPoint: Number,
  lastRestocked: Date,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
