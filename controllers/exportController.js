const Ride = require("../models/Ride")
const { generateCSV } = require('../utils/csvGenerator')
const { generatePDF } = require("../utils/pdfGenerator")

exports.exportRideHistoryCSV = async (req, res) => {
  try {
    let query = {}

    if (req.user.role === 'rider') {
      query.rider = req.user.id
    } else if (req.user.role === 'driver') {
      query.driver = req.user.id
    }

    let rides = await Ride.find(query)
      .populate('rider', 'name email')
      .populate("driver", "name email")
      .sort({ createdAt: -1 })

    let csvData = rides.map(function(ride) {
      return {
        RideID: ride._id.toString(),
        Status: ride.status,
        Pickup: ride.pickupLocation.address,
        Dropoff: ride.dropoffLocation.address,
        Distance_KM: ride.distance.toFixed(2),
        Duration_Min: ride.duration.toFixed(2),
        Total_Fare: ride.fare.totalFare.toFixed(2),
        Payment: ride.paymentStatus,
        Rider: ride.rider ? ride.rider.name : 'N/A',
        Driver: ride.driver ? ride.driver.name : "Unassigned",
        Date: ride.createdAt.toISOString().split('T')[0]
      }
    })

    let csv = generateCSV(csvData)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader("Content-Disposition", "attachment; filename=ride-history.csv")
    res.send(csv)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.exportRideHistoryPDF = async function(req, res) {
  try {
    let query = {}

    if (req.user.role === "rider") {
      query.rider = req.user.id
    } else if (req.user.role === 'driver') {
      query.driver = req.user.id
    }

    let rides = await Ride.find(query)
      .populate('rider', "name email")
      .populate('driver', 'name email')
      .sort({ createdAt: -1 })

    let rideData = rides.map(ride => ({
      id: ride._id.toString().slice(-8),
      status: ride.status,
      pickup: ride.pickupLocation.address,
      dropoff: ride.dropoffLocation.address,
      distance: ride.distance.toFixed(2),
      duration: ride.duration.toFixed(2),
      fare: ride.fare.totalFare.toFixed(2),
      rider: ride.rider ? ride.rider.name : 'N/A',
      driver: ride.driver ? ride.driver.name : "Unassigned",
      date: ride.createdAt.toISOString().split('T')[0]
    }))

    let pdfBuffer = await generatePDF(rideData, req.user.name)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader("Content-Disposition", "attachment; filename=ride-history.pdf")
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
