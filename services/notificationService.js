const Notification = require('../models/Notification')

const sendNotification = async (userId, type, title, message, rideId) => {
  try {
    let notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      ride: rideId || null
    })

    try {
      const { getIO } = require('../websocket/socket')
      let io = getIO()
      io.to(userId.toString()).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        ride: rideId,
        createdAt: notification.createdAt
      })
    } catch (socketErr) {
      console.log("Socket not available, notification saved to db only")
    }

    return notification
  } catch (err) {
    console.error("Failed to send notification:", err.message)
    return null
  }
}

const getUserNotifications = async function(userId, page, limit) {
  let pageNum = parseInt(page) || 1
  let limitNum = parseInt(limit) || 20
  let skip = (pageNum - 1) * limitNum

  let notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)

  let total = await Notification.countDocuments({ user: userId })
  let unreadCount = await Notification.countDocuments({ user: userId, isRead: false })

  return {
    notifications,
    total,
    unreadCount,
    pages: Math.ceil(total / limitNum)
  }
}

const markAsRead = async (notificationId, userId) => {
  let notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  )
  return notification
}

const markAllRead = async function(userId) {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  )
  return { success: true }
}

module.exports = { sendNotification, getUserNotifications, markAsRead, markAllRead }
