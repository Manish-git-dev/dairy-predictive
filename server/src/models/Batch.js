const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  milkLots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MilkLot' }],
  totalQuantity: Number,
  averageFat: Number,
  averageSnf: Number,
  processingDate: Date,
  status: { type: String, enum: ['created', 'processing', 'processed', 'packaged', 'dispatched'], default: 'created' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  plantYield: Number,
  wastage: Number,
  processingNotes: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

batchSchema.index({ organization: 1, createdAt: -1 });
batchSchema.index({ organization: 1, status: 1, createdAt: -1 });
batchSchema.index({ organization: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model('Batch', batchSchema);
