const mongoose = require('mongoose');

const qualityTestSchema = new mongoose.Schema({
  testId: { type: String, required: true, unique: true },
  milkLot: { type: mongoose.Schema.Types.ObjectId, ref: 'MilkLot' },
  collectionCentre: String,
  tester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  testDate: Date,
  parameters: {
    fat: Number,
    snf: Number,
    clr: Number,
    pH: Number,
    temperature: Number,
    density: Number,
    acidity: Number,
    adulteration: {
      detected: Boolean,
      type: String
    }
  },
  result: { type: String, enum: ['pass', 'fail', 'borderline'] },
  grade: { type: String, enum: ['A', 'B', 'C', 'rejected'] },
  notes: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('QualityTest', qualityTestSchema);
