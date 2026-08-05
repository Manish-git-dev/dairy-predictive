const mongoose = require('mongoose');

const collectionCentreSchema = new mongoose.Schema({
  centreId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    village: String,
    district: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  capacityLitres: Number,
  currentUtilization: { type: Number, default: 0 },
  chillingCapacity: Number,
  chillingTemperature: { type: Number, default: 4 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contactPhone: String,
  equipment: [{
    name: String,
    status: { type: String, enum: ['operational', 'maintenance', 'faulty'] },
    lastMaintenance: Date
  }],
  isActive: { type: Boolean, default: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('CollectionCentre', collectionCentreSchema);
