const mongoose = require('mongoose')

const rideSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  },
  dropoffLocation: {
    address: { type: String, required: true },
    coordinates: { type: [Number], required: true }
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  fare: {
    baseFare: { type: Number, default: 0 },
    distanceFare: { type: Number, default: 0 },
    timeFare: { type: Number, default: 0 },
    surgeFare: { type: Number, default: 0 },
    totalFare: { type: Number, default: 0 }
  },
  distance: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  route: {
    type: Object,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "refunded"],
    default: 'pending'
  },
  startTime: Date,
  endTime: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String
}, { timestamps: true })

rideSchema.index({ rider: 1, createdAt: -1 })
rideSchema.index({ driver: 1, createdAt: -1 })
rideSchema.index({ status: 1 })
rideSchema.index({ "pickupLocation.coordinates": "2dsphere" })

module.exports = mongoose.model('Ride', rideSchema)
