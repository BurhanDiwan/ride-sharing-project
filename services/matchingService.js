const User = require("../models/User")

const findNearestDrivers = async (coordinates, maxDistanceKm) => {
  let maxDistMeters = (maxDistanceKm || 10) * 1000

  try {
    let drivers = await User.find({
      role: 'driver',
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates
          },
          $maxDistance: maxDistMeters
        }
      }
    }).select('name phone location averageRating vehicleInfo').limit(10)

    return drivers
  } catch (err) {
    let fallbackDrivers = await User.find({
      role: 'driver',
      isAvailable: true
    }).select('name phone location averageRating vehicleInfo').limit(5)

    return fallbackDrivers
  }
}

const findBestDriver = async function(coordinates) {
  let drivers = await findNearestDrivers(coordinates, 15)

  if (drivers.length === 0) return null

  let sorted = drivers.sort((a, b) => {
    let ratingDiff = (b.averageRating || 0) - (a.averageRating || 0)
    if (Math.abs(ratingDiff) > 0.5) return ratingDiff
    return 0
  })

  return sorted[0]
}

module.exports = { findNearestDrivers, findBestDriver }
