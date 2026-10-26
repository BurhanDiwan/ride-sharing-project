const MAPBOX_BASE_URL = "https://api.mapbox.com"

let mapboxToken = process.env.MAPBOX_ACCESS_TOKEN

const getDirections = async (startCoords, endCoords) => {
  const fetch = require('node-fetch')
  let url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?access_token=${mapboxToken}&geometries=geojson`

  try {
    let response = await fetch(url)
    let data = await response.json()

    if (data.routes && data.routes.length > 0) {
      let route = data.routes[0]
      return {
        distance: route.distance / 1000,
        duration: route.duration / 60,
        geometry: route.geometry
      }
    }
    return null
  } catch (err) {
    console.error('Mapbox API error:', err.message)
    return null
  }
}

const geocodeAddress = async function(address) {
  const fetch = require('node-fetch')
  let encodedAddress = encodeURIComponent(address)
  let url = MAPBOX_BASE_URL + "/geocoding/v5/mapbox.places/" + encodedAddress + ".json?access_token=" + mapboxToken

  try {
    let response = await fetch(url)
    let data = await response.json()

    if (data.features && data.features.length > 0) {
      let place = data.features[0]
      return {
        coordinates: place.center,
        placeName: place.place_name
      }
    }
    return null
  } catch (err) {
    console.error("Geocoding error:", err.message)
    return null
  }
}

module.exports = { getDirections, geocodeAddress }
