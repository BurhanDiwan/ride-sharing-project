const request = require("supertest")
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const express = require('express')

let mongoServer
let app
let riderToken
let driverToken
let rideId

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  process.env.JWT_SECRET = 'testsecretkey123'
  process.env.JWT_EXPIRE = '1d'
  process.env.BASE_FARE = '2.50'
  process.env.PER_KM_RATE = '1.20'
  process.env.PER_MINUTE_RATE = '0.30'
  process.env.SURGE_MULTIPLIER = '1.5'

  app = express()
  app.use(express.json())
  app.use('/api/auth', require('../routes/auth'))
  app.use('/api/rides', require('../routes/rides'))
  app.use('/api/drivers', require("../routes/drivers"))

  let riderRes = await request(app).post('/api/auth/register').send({
    name: 'Test Rider',
    email: 'rider@test.com',
    password: 'password123',
    role: 'rider'
  })
  riderToken = riderRes.body.token

  let driverRes = await request(app).post('/api/auth/register').send({
    name: 'Test Driver',
    email: "driver@test.com",
    password: 'password123',
    role: 'driver'
  })
  driverToken = driverRes.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

describe('Ride Endpoints', () => {
  describe('POST /api/rides', () => {
    it('should create a ride request', async () => {
      let res = await request(app)
        .post('/api/rides')
        .set('Authorization', 'Bearer ' + riderToken)
        .send({
          pickupAddress: '123 Main St',
          pickupCoordinates: [-73.9857, 40.7484],
          dropoffAddress: '456 Park Ave',
          dropoffCoordinates: [-73.9712, 40.7648]
        })

      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('requested')
      rideId = res.body.data._id
    })

    it('should fail without coordinates', async () => {
      let res = await request(app)
        .post('/api/rides')
        .set("Authorization", `Bearer ${riderToken}`)
        .send({
          pickupAddress: 'Some place'
        })

      expect(res.statusCode).toBe(400)
    })

    it('should not allow driver to create ride', async () => {
      let res = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          pickupAddress: '789 Test Blvd',
          pickupCoordinates: [-73.99, 40.75],
          dropoffAddress: '101 End St',
          dropoffCoordinates: [-73.97, 40.76]
        })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('GET /api/rides', () => {
    it('should get rides for authenticated user', async () => {
      let res = await request(app)
        .get('/api/rides')
        .set('Authorization', 'Bearer ' + riderToken)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should fail without auth', async () => {
      let res = await request(app).get('/api/rides')
      expect(res.statusCode).toBe(401)
    })
  })

  describe('Ride Lifecycle', () => {
    it('should accept a ride', async () => {
      if (!rideId) return

      let res = await request(app)
        .put(`/api/rides/${rideId}/accept`)
        .set('Authorization', 'Bearer ' + driverToken)

      expect(res.statusCode).toBe(200)
      expect(res.body.data.status).toBe("accepted")
    })

    it('should start a ride', async () => {
      if (!rideId) return

      let res = await request(app)
        .put(`/api/rides/${rideId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.data.status).toBe('in_progress')
    })

    it("should complete a ride", async () => {
      if (!rideId) return

      let res = await request(app)
        .put(`/api/rides/${rideId}/complete`)
        .set("Authorization", "Bearer " + driverToken)

      expect(res.statusCode).toBe(200)
      expect(res.body.data.status).toBe('completed')
    })
  })
})
