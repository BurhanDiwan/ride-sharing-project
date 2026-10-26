const express = require("express")
const router = express.Router()
const { protect } = require('../middleware/auth')
const { authorize } = require("../middleware/rbac")
const { estimateFare } = require('../services/fareService')
const {
  createRide,
  getRides,
  getRideById,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
  searchRides
} = require('../controllers/rideController')

router.post('/', protect, authorize('rider'), createRide)
router.get('/', protect, getRides)
router.get('/search', protect, searchRides)

router.post('/estimate-fare', protect, async (req, res) => {
  try {
    let { pickupCoordinates, dropoffCoordinates } = req.body

    if (!pickupCoordinates || !dropoffCoordinates) {
      return res.status(400).json({ success: false, error: "Pickup and dropoff coordinates required" })
    }

    let estimate = await estimateFare(pickupCoordinates, dropoffCoordinates)
    res.json({ success: true, data: estimate })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', protect, getRideById)
router.put('/:id/accept', protect, authorize("driver"), acceptRide)
router.put('/:id/start', protect, authorize('driver'), startRide)
router.put("/:id/complete", protect, authorize('driver'), completeRide)
router.put('/:id/cancel', protect, cancelRide)

module.exports = router
