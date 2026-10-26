const mongoose = require('mongoose')
const Ride = require("../models/Ride")
const User = require('../models/User')

exports.getRideTrends = async (req, res) => {
  try {
    let { period } = req.query
    let groupBy

    if (period === 'weekly') {
      groupBy = { $isoWeek: "$createdAt" }
    } else if (period === 'monthly') {
      groupBy = { $month: '$createdAt' }
    } else {
      groupBy = { $dayOfYear: "$createdAt" }
    }

    let trends = await Ride.aggregate([
      {
        $group: {
          _id: {
            period: groupBy,
            year: { $year: '$createdAt' },
            status: "$status"
          },
          count: { $sum: 1 },
          totalFare: { $sum: '$fare.totalFare' },
          avgDistance: { $avg: "$distance" }
        }
      },
      { $sort: { '_id.year': 1, '_id.period': 1 } }
    ])

    res.json({ success: true, data: trends })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getDriverPerformance = async function(req, res) {
  try {
    let drivers = await User.find({ role: 'driver' })
      .select("name averageRating totalRides earnings")
      .sort({ averageRating: -1 })
      .limit(20)

    let performanceData = []

    for (let i = 0; i < drivers.length; i++) {
      let driver = drivers[i]
      let completedCount = await Ride.countDocuments({ driver: driver._id, status: 'completed' })
      let cancelledCount = await Ride.countDocuments({ driver: driver._id, status: "cancelled" })

      performanceData.push({
        driver: {
          id: driver._id,
          name: driver.name,
          rating: driver.averageRating
        },
        completedRides: completedCount,
        cancelledRides: cancelledCount,
        totalEarnings: driver.earnings,
        completionRate: completedCount + cancelledCount > 0
          ? Math.round((completedCount / (completedCount + cancelledCount)) * 100)
          : 0
      })
    }

    res.json({ success: true, data: performanceData })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getEarningsOverTime = async (req, res) => {
  try {
    let driverId = req.query.driverId || req.user.id
    let { period } = req.query

    let matchStage = {
      driver: new mongoose.Types.ObjectId(driverId),
      status: 'completed'
    }

    let groupFormat
    if (period === "monthly") {
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: "$createdAt" } }
    } else {
      groupFormat = {
        year: { $year: "$createdAt" },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      }
    }

    let earnings = await Ride.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalEarnings: { $sum: "$fare.totalFare" },
          rideCount: { $sum: 1 },
          avgFare: { $avg: '$fare.totalFare' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])

    res.json({ success: true, data: earnings })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getUserEngagement = async function(req, res) {
  try {
    let totalRiders = await User.countDocuments({ role: 'rider' })
    let totalDrivers = await User.countDocuments({ role: "driver" })
    let activeDrivers = await User.countDocuments({ role: 'driver', isAvailable: true })

    let totalRides = await Ride.countDocuments()
    let completedRides = await Ride.countDocuments({ status: "completed" })
    let cancelledRides = await Ride.countDocuments({ status: 'cancelled' })
    let activeRides = await Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'in_progress'] } })

    let revenueResult = await Ride.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare.totalFare' }, avg: { $avg: "$fare.totalFare" } } }
    ])

    let revenue = revenueResult.length > 0 ? revenueResult[0] : { total: 0, avg: 0 }

    res.json({
      success: true,
      data: {
        users: { totalRiders, totalDrivers, activeDrivers },
        rides: { totalRides, completedRides, cancelledRides, activeRides, completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0 },
        revenue: {
          totalRevenue: Math.round(revenue.total * 100) / 100,
          averageFare: Math.round(revenue.avg * 100) / 100
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
