const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['ride_request', 'ride_accepted', 'ride_started', 'ride_completed', 'ride_cancelled', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride"
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

notificationSchema.index({ user: 1, isRead: 1 })
notificationSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
