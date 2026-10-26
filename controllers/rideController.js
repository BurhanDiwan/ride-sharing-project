const Ride = require('../models/Ride')
const User = require("../models/User")
const { calculateFare } = require('../services/fareService')
const { findNearestDrivers } = require("../services/matchingService")
const { getDirections } = require('../config/mapbox')
const { sendNotification } = require('../services/notificationService')

exports.createRide = async (req, res) => {
  try {
    let { pickupAddress, pickupCoordinates, dropoffAddress, dropoffCoordinates } = req.body

    if (!pickupCoordinates || !dropoffCoordinates) {
      return res.status(400).json({ success: false, error: "Pickup and dropoff coordinates are required" })
    }

    let routeData = await getDirections(pickupCoordinates, dropoffCoordinates)

    let fareDetails
    if (routeData) {
      fareDetails = calculateFare(routeData.distance, routeData.duration)
    } else {
      let defaultDist = 5
      let defaultDur = 12
      fareDetails = calculateFare(defaultDist, defaultDur)
    }

    let ride = await Ride.create({
      rider: req.user.id,
      pickupLocation: {
        address: pickupAddress,
        coordinates: pickupCoordinates
      },
      dropoffLocation: {
        address: dropoffAddress,
        coordinates: dropoffCoordinates
      },
      distance: routeData ? routeData.distance : 5,
      duration: routeData ? routeData.duration : 12,
      route: routeData ? routeData.geometry : null,
      fare: fareDetails
    })

    let nearbyDrivers = await findNearestDrivers(pickupCoordinates, 10)

    for (let driver of nearbyDrivers) {
      await sendNotification(driver._id, 'ride_request', 'New Ride Request', `Ride from ${pickupAddress} to ${dropoffAddress}`, ride._id)
    }

    await ride.populate('rider', 'name email phone')

    res.status(201).json({ success: true, data: ride })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getRides = async function(req, res) {
  try {
    let query = {}
    let { status, page, limit } = req.query

    if (req.user.role === 'rider') {
      query.rider = req.user.id
    } else if (req.user.role === "driver") {
      query.driver = req.user.id
    }

    if (status) query.status = status

    let pageNum = parseInt(page) || 1
    let limitNum = parseInt(limit) || 10
    let skip = (pageNum - 1) * limitNum

    let rides = await Ride.find(query)
      .populate('rider', 'name email phone')
      .populate("driver", "name email phone averageRating")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    let total = await Ride.countDocuments(query)

    res.json({
      success: true,
      count: rides.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: rides
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getRideById = async (req, res) => {
  try {
    let ride = await Ride.findById(req.params.id)
      .populate('rider', 'name email phone')
      .populate('driver', 'name email phone averageRating vehicleInfo')

    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' })
    }

    if (req.user.role !== 'admin' &&
        ride.rider._id.toString() !== req.user.id &&
        (ride.driver && ride.driver._id.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, error: "Not authorized to view this ride" })
    }

    res.json({ success: true, data: ride })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.acceptRide = async function(req, res) {
  try {
    let ride = await Ride.findById(req.params.id)

    if (!ride) {
      return res.status(404).json({ success: false, error: "Ride not found" })
    }

    if (ride.status !== 'requested') {
      return res.status(400).json({ success: false, error: 'Ride is no longer available' })
    }

    ride.driver = req.user.id
    ride.status = 'accepted'
    await ride.save()

    await User.findByIdAndUpdate(req.user.id, { isAvailable: false })

    await sendNotification(ride.rider, 'ride_accepted', 'Ride Accepted', 'A driver has accepted your ride request', ride._id)

    await ride.populate('driver', 'name email phone vehicleInfo averageRating')

    res.json({ success: true, data: ride })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.startRide = async (req, res) => {
  try {
    let ride = await Ride.findById(req.params.id)

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' })

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' })
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ success: false, error: "Ride must be accepted before starting" })
    }

    ride.status = 'in_progress'
    ride.startTime = new Date()
    await ride.save()

    await sendNotification(ride.rider, 'ride_started', "Ride Started", 'Your ride has started', ride._id)

    res.json({ success: true, data: ride })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.completeRide = async function(req, res) {
  try {
    let ride = await Ride.findById(req.params.id)

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' })

    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Not authorized" })
    }

    if (ride.status !== 'in_progress') {
      return res.status(400).json({ success: false, error: 'Ride must be in progress to complete' })
    }

    ride.status = 'completed'
    ride.endTime = new Date()
    ride.paymentStatus = "completed"
    await ride.save()

    await User.findByIdAndUpdate(req.user.id, {
      isAvailable: true,
      $inc: { totalRides: 1, earnings: ride.fare.totalFare }
    })

    await User.findByIdAndUpdate(ride.rider, {
      $inc: { totalRides: 1 }
    })

    await sendNotification(ride.rider, 'ride_completed', 'Ride Completed', `Your ride is complete. Total fare: $${ride.fare.totalFare}`, ride._id)

    res.json({ success: true, data: ride })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.cancelRide = async (req, res) => {
  try {
    let ride = await Ride.findById(req.params.id)

    if (!ride) return res.status(404).json({ success: false, error: "Ride not found" })

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Cannot cancel this ride' })
    }

    let userId = req.user.id
    if (ride.rider.toString() !== userId && (ride.driver && ride.driver.toString() !== userId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this ride' })
    }

    ride.status = 'cancelled'
    ride.cancelledBy = userId
    ride.cancelReason = req.body.reason || "No reason provided"
    await ride.save()

    if (ride.driver) {
      await User.findByIdAndUpdate(ride.driver, { isAvailable: true })

      let notifyUserId = ride.rider.toString() === userId ? ride.driver : ride.rider
      await sendNotification(notifyUserId, 'ride_cancelled', 'Ride Cancelled', 'The ride has been cancelled', ride._id)
    }

    res.json({ success: true, data: ride })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.searchRides = async (req, res) => {
  try {
    let { destination, driverRating, maxEta, status } = req.query
    let query = { status: status || 'requested' }

    if (destination) {
      query['dropoffLocation.address'] = { $regex: destination, $options: 'i' }
    }

    let rides = await Ride.find(query)
      .populate('rider', 'name phone')
      .populate('driver', "name phone averageRating vehicleInfo")
      .sort({ createdAt: -1 })

    if (driverRating) {
      rides = rides.filter(ride => {
        if (!ride.driver) return true
        return ride.driver.averageRating >= parseFloat(driverRating)
      })
    }

    if (maxEta) {
      rides = rides.filter(r => r.duration <= parseFloat(maxEta))
    }

    res.json({ success: true, count: rides.length, data: rides })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
