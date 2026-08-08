const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  period: {
    startDate: Date,
    endDate: Date
  },
  milkLots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MilkLot' }],
  totalQuantity: Number,
  averageFat: Number,
  averageSnf: Number,
  baseAmount: Number,
  fatBonus: Number,
  snfBonus: Number,
  deductions: Number,
  netAmount: Number,
  status: { type: String, enum: ['pending', 'calculated', 'approved', 'disbursed', 'disputed', 'settled'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  disbursedDate: Date,
  transactionReference: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

paymentSchema.index({ organization: 1, createdAt: -1 });
paymentSchema.index({ organization: 1, farmer: 1, createdAt: -1 });
paymentSchema.index({ organization: 1, status: 1, createdAt: -1 });
paymentSchema.index({ organization: 1, 'period.startDate': 1, 'period.endDate': 1 });

module.exports = mongoose.model('Payment', paymentSchema);
