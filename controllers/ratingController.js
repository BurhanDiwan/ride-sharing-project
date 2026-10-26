const mongoose = require('mongoose')
const Rating = require('../models/Rating')
const Ride = require("../models/Ride")

exports.createRating = async (req, res) => {
  try {
    let { rideId, rating, review } = req.body

    let ride = await Ride.findById(rideId)

    if (!ride) {
      return res.status(404).json({ success: false, error: "Ride not found" })
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Can only rate completed rides' })
    }

    if (ride.rider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Only the rider can rate this ride' })
    }

    let existingRating = await Rating.findOne({ ride: rideId, rider: req.user.id })
    if (existingRating) {
      return res.status(400).json({ success: false, error: "You have already rated this ride" })
    }

    let newRating = await Rating.create({
      ride: rideId,
      rider: req.user.id,
      driver: ride.driver,
      rating,
      review
    })

    res.status(201).json({ success: true, data: newRating })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getDriverRatings = async function(req, res) {
  try {
    let { page, limit } = req.query
    let driverId = req.params.driverId

    let pageNum = parseInt(page) || 1
    let limitNum = parseInt(limit) || 10
    let skip = (pageNum - 1) * limitNum

    let ratings = await Rating.find({ driver: driverId })
      .populate('rider', 'name')
      .populate("ride", "pickupLocation dropoffLocation createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    let total = await Rating.countDocuments({ driver: driverId })

    let driverObjectId = new mongoose.Types.ObjectId(driverId)
    let avgResult = await Rating.aggregate([
      { $match: { driver: driverObjectId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ])

    let averageRating = avgResult.length > 0 ? Math.round(avgResult[0].avg * 10) / 10 : 0

    res.json({
      success: true,
      averageRating,
      total,
      pages: Math.ceil(total / limitNum),
      data: ratings
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getRatingByRide = async (req, res) => {
  try {
    let rating = await Rating.findOne({ ride: req.params.rideId })
      .populate('rider', 'name')
      .populate('driver', 'name')

    if (!rating) {
      return res.status(404).json({ success: false, error: 'No rating found for this ride' })
    }

    res.json({ success: true, data: rating })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
