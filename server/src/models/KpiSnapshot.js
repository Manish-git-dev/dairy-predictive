const mongoose = require('mongoose');

const kpiSnapshotSchema = new mongoose.Schema({
  date: Date,
  period: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  metrics: {
    collectionVolume: Number,
    avgFat: Number,
    avgSnf: Number,
    rejectionRate: Number,
    avgChillingTime: Number,
    plantYield: Number,
    spoilageRate: Number,
    deliverySlaCompliance: Number,
    paymentAccuracy: Number,
    activeFarmers: Number,
    activeRoutes: Number
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

kpiSnapshotSchema.index({ organization: 1, date: 1 });
kpiSnapshotSchema.index({ organization: 1, period: 1, date: 1 });

module.exports = mongoose.model('KpiSnapshot', kpiSnapshotSchema);
