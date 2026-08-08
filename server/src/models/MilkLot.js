const mongoose = require('mongoose');

const milkLotSchema = new mongoose.Schema({
  lotId: { type: String, required: true, unique: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  collectionCentre: String,
  collectionDate: Date,
  shift: { type: String, enum: ['morning', 'evening'] },
  quantityLitres: Number,
  temperature: Number,
  quality: {
    fat: Number,
    snf: Number,
    clr: Number,
    pH: Number,
    adulteration: { type: Boolean, default: false },
    grade: { type: String, enum: ['A', 'B', 'C', 'rejected'] }
  },
  status: { type: String, enum: ['collected', 'tested', 'chilled', 'in_transit', 'at_plant', 'processed', 'rejected'], default: 'collected' },
  rejectionReason: String,
  pricePerLitre: Number,
  totalAmount: Number,
  tanker: { type: mongoose.Schema.Types.ObjectId, ref: 'Tanker' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

milkLotSchema.index({ organization: 1, createdAt: -1 });
milkLotSchema.index({ organization: 1, collectionDate: -1 });
milkLotSchema.index({ organization: 1, farmer: 1, createdAt: -1 });
milkLotSchema.index({ organization: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MilkLot', milkLotSchema);
