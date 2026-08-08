const mongoose = require('mongoose');

const tankerSchema = new mongoose.Schema({
  tankerId: { type: String, required: true, unique: true },
  registrationNumber: String,
  capacityLitres: Number,
  currentLoad: { type: Number, default: 0 },
  driver: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  status: { type: String, enum: ['available', 'in_transit', 'loading', 'unloading', 'maintenance'], default: 'available' },
  currentLocation: {
    lat: Number,
    lng: Number
  },
  temperature: Number,
  route: {
    origin: String,
    destination: String,
    estimatedArrival: Date,
    actualArrival: Date
  },
  assignedCentres: [String],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true }
}, { timestamps: true });

tankerSchema.index({ organization: 1, createdAt: -1 });
tankerSchema.index({ organization: 1, status: 1, createdAt: -1 });

tankerSchema.index({ organization: 1, 'route.estimatedArrival': 1 });

module.exports = mongoose.model('Tanker', tankerSchema);
