const express = require('express')
const router = express.Router()
const { protect } = require("../middleware/auth")
const { authorize } = require('../middleware/rbac')
const {
  updateAvailability,
  updateLocation,
  getDriverRides,
  getDriverStats,
  getAvailableDrivers
} = require('../controllers/driverController')

router.put('/availability', protect, authorize('driver'), updateAvailability)
router.put('/location', protect, authorize("driver"), updateLocation)
router.get('/rides', protect, authorize('driver'), getDriverRides)
router.get('/available', protect, getAvailableDrivers)
router.get('/stats/:id?', protect, getDriverStats)

module.exports = router
