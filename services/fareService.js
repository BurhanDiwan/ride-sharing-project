const calculateFare = (distanceKm, durationMin) => {
  let baseFare = parseFloat(process.env.BASE_FARE) || 2.50
  let perKmRate = parseFloat(process.env.PER_KM_RATE) || 1.20
  let perMinRate = parseFloat(process.env.PER_MINUTE_RATE) || 0.30

  let distanceFare = distanceKm * perKmRate
  let timeFare = durationMin * perMinRate

  let surgeMultiplier = getSurgeMultiplier()
  let surgeFare = 0

  if (surgeMultiplier > 1) {
    surgeFare = (baseFare + distanceFare + timeFare) * (surgeMultiplier - 1)
  }

  let totalFare = baseFare + distanceFare + timeFare + surgeFare

  return {
    baseFare: Math.round(baseFare * 100) / 100,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    surgeFare: Math.round(surgeFare * 100) / 100,
    totalFare: Math.round(totalFare * 100) / 100,
    surgeMultiplier
  }
}

function getSurgeMultiplier() {
  let now = new Date()
  let hour = now.getHours()

  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return parseFloat(process.env.SURGE_MULTIPLIER) || 1.5
  }

  if (hour >= 22 || hour <= 5) {
    return 1.25
  }

  return 1.0
}

const estimateFare = async function(pickupCoords, dropoffCoords) {
  const { getDirections } = require('../config/mapbox')

  let routeData = await getDirections(pickupCoords, dropoffCoords)

  if (!routeData) {
    let dx = (dropoffCoords[0] - pickupCoords[0]) * 111 * Math.cos(pickupCoords[1] * (Math.PI / 180))
    let dy = (dropoffCoords[1] - pickupCoords[1]) * 111
    let dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100
    if (dist <= 0) dist = 2.5
    let duration = Math.round(dist * 2.2 * 10) / 10
    let fareDetails = calculateFare(dist, duration)
    return {
      distance: dist,
      duration: duration,
      fare: fareDetails
    }
  }

  let fareDetails = calculateFare(routeData.distance, routeData.duration)

  return {
    distance: routeData.distance,
    duration: routeData.duration,
    fare: fareDetails
  }
}

module.exports = { calculateFare, estimateFare, getSurgeMultiplier }
