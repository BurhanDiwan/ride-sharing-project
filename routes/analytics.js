const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { authorize } = require("../middleware/rbac")
const {
  getRideTrends,
  getDriverPerformance,
  getEarningsOverTime,
  getUserEngagement
} = require('../controllers/analyticsController')
const { getUserNotifications, markAsRead, markAllRead } = require("../services/notificationService")

router.get('/trends', protect, authorize('admin'), getRideTrends)
router.get('/driver-performance', protect, authorize("admin"), getDriverPerformance)
router.get('/earnings', protect, authorize('driver', 'admin'), getEarningsOverTime)
router.get('/engagement', protect, authorize('admin'), getUserEngagement)

router.get('/notifications', protect, async (req, res) => {
  try {
    let result = await getUserNotifications(req.user.id, req.query.page, req.query.limit)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    let notification = await markAsRead(req.params.id, req.user.id)
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' })
    }
    res.json({ success: true, data: notification })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/notifications/read-all', protect, async function(req, res) {
  try {
    await markAllRead(req.user.id)
    res.json({ success: true, message: "All notifications marked as read" })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
