const express = require('express')
const router = express.Router()
const { protect } = require("../middleware/auth")
const { exportRideHistoryCSV, exportRideHistoryPDF } = require('../controllers/exportController')

router.get('/csv', protect, exportRideHistoryCSV)
router.get("/pdf", protect, exportRideHistoryPDF)

module.exports = router
