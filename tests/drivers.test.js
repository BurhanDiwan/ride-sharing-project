const request = require('supertest')
const mongoose = require("mongoose")
const { MongoMemoryServer } = require('mongodb-memory-server')
const express = require('express')

let mongoServer, app, driverToken

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  process.env.JWT_SECRET = 'testsecretkey123'
  process.env.JWT_EXPIRE = '1d'

  app = express()
  app.use(express.json())
  app.use('/api/auth', require('../routes/auth'))
  app.use('/api/drivers', require('../routes/drivers'))

  let res = await request(app).post('/api/auth/register').send({
    name: 'Driver Test',
    email: 'drivertest@test.com',
    password: 'password123',
    role: "driver"
  })
  driverToken = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

describe('Driver Endpoints', () => {
  it('should update driver availability', async () => {
    let res = await request(app)
      .put('/api/drivers/availability')
      .set('Authorization', 'Bearer ' + driverToken)
      .send({ isAvailable: true, coordinates: [-73.9857, 40.7484] })

    expect(res.statusCode).toBe(200)
    expect(res.body.data.isAvailable).toBe(true)
  })

  it('should update driver location', async () => {
    let res = await request(app)
      .put('/api/drivers/location')
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ coordinates: [-73.99, 40.75] })

    expect(res.statusCode).toBe(200)
    expect(res.body.data.location).toBeDefined()
  })

  it('should get available drivers', async () => {
    let res = await request(app)
      .get('/api/drivers/available')
      .set('Authorization', 'Bearer ' + driverToken)

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("should get driver stats", async () => {
    let res = await request(app)
      .get('/api/drivers/stats')
      .set('Authorization', `Bearer ${driverToken}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.data).toBeDefined()
  })
})
