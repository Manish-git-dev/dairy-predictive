const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  contactEmail: String,
  contactPhone: String,
  subscriptionTier: { type: String, enum: ['basic', 'standard', 'premium'], default: 'basic' },
  isActive: { type: Boolean, default: true },
  settings: {
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    milkPricePerLitre: Number,
    fatBonusRate: Number,
    snfBonusRate: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
