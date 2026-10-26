const express = require("express")
const router = express.Router()
const { protect } = require('../middleware/auth')
const { authorize } = require('../middleware/rbac')
const { createRating, getDriverRatings, getRatingByRide } = require("../controllers/ratingController")

router.post('/', protect, authorize('rider'), createRating)
router.get('/driver/:driverId', protect, getDriverRatings)
router.get("/ride/:rideId", protect, getRatingByRide)

module.exports = router
