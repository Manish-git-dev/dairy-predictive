const mongoose = require('mongoose');

const finiteNumber = (min = null, max = null) => ({
  type: Number,
  validate: {
    validator: (value) => {
      if (!Number.isFinite(value)) return false;
      if (min !== null && value < min) return false;
      if (max !== null && value > max) return false;
      return true;
    },
    message: (props) => `${props.path} must be a finite number within the allowed range`
  }
});

const kpiSnapshotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  metrics: {
    collectionVolume: finiteNumber(0),
    avgFat: finiteNumber(0),
    avgSnf: finiteNumber(0),
    rejectionRate: finiteNumber(0, 100),
    avgChillingTime: finiteNumber(0),
    plantYield: finiteNumber(0, 100),
    spoilageRate: finiteNumber(0, 100),
    deliverySlaCompliance: finiteNumber(0, 100),
    paymentAccuracy: finiteNumber(0, 100),
    activeFarmers: finiteNumber(0),
    activeRoutes: finiteNumber(0)
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

kpiSnapshotSchema.index({ organization: 1, date: 1 });
kpiSnapshotSchema.index({ organization: 1, period: 1, date: 1 });

module.exports = mongoose.model('KpiSnapshot', kpiSnapshotSchema);
