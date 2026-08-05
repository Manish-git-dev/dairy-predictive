const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  farmerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: String,
  email: String,
  address: {
    village: String,
    district: String,
    state: String,
    pincode: String
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  cattleCount: Number,
  avgDailyYield: Number,
  registrationDate: Date,
  isActive: { type: Boolean, default: true },
  rating: { type: Number, min: 1, max: 5, default: 3 },
  assignedCollectionCentre: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
