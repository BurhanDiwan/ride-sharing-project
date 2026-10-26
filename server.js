const express = require('express')
const http = require('http')
const cors = require("cors")
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const { initSocket } = require('./websocket/socket')

dotenv.config()

const app = express()
let server = http.createServer(app)

connectDB()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

const authRoutes = require('./routes/auth')
const rideRoutes = require("./routes/rides")
const driverRoutes = require('./routes/drivers')
const ratingRoutes = require('./routes/ratings')
const analyticsRoutes = require("./routes/analytics")
const exportRoutes = require('./routes/export')

app.use('/api/auth', authRoutes)
app.use('/api/rides', rideRoutes)
app.use("/api/drivers", driverRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/export', exportRoutes)

app.get('/api-info', function(req, res) {
  res.json({
    status: 'online',
    service: 'Ride Sharing Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  let statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  })
})

initSocket(server)

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, server }
