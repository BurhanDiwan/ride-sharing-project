const User = require("../models/User")
const Ride = require('../models/Ride')

exports.updateAvailability = async (req, res) => {
  try {
    let { isAvailable, coordinates } = req.body

    let updateData = { isAvailable }

    if (coordinates && coordinates.length === 2) {
      updateData.location = {
        type: 'Point',
        coordinates: coordinates
      }
    }

    let driver = await User.findByIdAndUpdate(req.user.id, updateData, { new: true })

    res.json({ success: true, data: driver })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.updateLocation = async function(req, res) {
  try {
    let { coordinates } = req.body

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ success: false, error: "Valid coordinates required" })
    }

    let driver = await User.findByIdAndUpdate(
      req.user.id,
      { location: { type: 'Point', coordinates } },
      { new: true }
    )

    res.json({ success: true, data: { location: driver.location } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getDriverRides = async (req, res) => {
  try {
    let { status, sortBy, minRating, maxDistance } = req.query
    let query = {}

    if (status) {
      query.status = status
    } else {
      query.status = 'requested'
    }

    let rides = await Ride.find(query)
      .populate("rider", "name phone averageRating")
      .sort(sortBy === 'distance' ? { distance: 1 } : { createdAt: -1 })

    if (minRating) {
      rides = rides.filter(function(ride) {
        return ride.rider && ride.rider.averageRating >= parseFloat(minRating)
      })
    }

    if (maxDistance) {
      rides = rides.filter(ride => ride.distance <= parseFloat(maxDistance))
    }

    res.json({ success: true, count: rides.length, data: rides })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getDriverStats = async function(req, res) {
  try {
    let driverId = req.params.id || req.user.id

    let driver = await User.findById(driverId).select('name averageRating totalRides earnings')

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' })
    }

    let completedRides = await Ride.countDocuments({ driver: driverId, status: 'completed' })
    let cancelledRides = await Ride.countDocuments({ driver: driverId, status: 'cancelled' })

    let recentRides = await Ride.find({ driver: driverId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fare distance duration createdAt")

    res.json({
      success: true,
      data: {
        driver,
        stats: {
          completedRides,
          cancelledRides,
          completionRate: completedRides > 0 ? Math.round((completedRides / (completedRides + cancelledRides)) * 100) : 0
        },
        recentRides
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getAvailableDrivers = async (req, res) => {
  try {
    let drivers = await User.find({ role: 'driver', isAvailable: true })
      .select('name averageRating location vehicleInfo totalRides')

    res.json({ success: true, count: drivers.length, data: drivers })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
