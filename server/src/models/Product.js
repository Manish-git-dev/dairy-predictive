const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: String,
  category: { type: String, enum: ['milk', 'butter', 'cheese', 'yogurt', 'cream', 'powder', 'ghee'] },
  unit: String,
  pricePerUnit: Number,
  shelfLifeDays: Number,
  storageTemperature: Number,
  isActive: { type: Boolean, default: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
