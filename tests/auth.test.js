const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const express = require('express')

let mongoServer
let app
let User

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  let uri = mongoServer.getUri()
  await mongoose.connect(uri)

  process.env.JWT_SECRET = 'testsecretkey123'
  process.env.JWT_EXPIRE = '1d'

  User = require('../models/User')

  app = express()
  app.use(express.json())
  app.use('/api/auth', require('../routes/auth'))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await User.deleteMany({})
})

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new rider', async () => {
      let res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'rider'
        })

      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.role).toBe('rider')
    })

    it('should register a new driver', async () => {
      let res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Driver Test',
          email: 'driver@example.com',
          password: 'password123',
          role: 'driver'
        })

      expect(res.statusCode).toBe(201)
      expect(res.body.user.role).toBe("driver")
    })

    it('should not register with duplicate email', async () => {
      await User.create({
        name: 'Existing',
        email: 'dup@example.com',
        password: 'password123'
      })

      let res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'dup@example.com',
          password: 'password123'
        })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('should fail with invalid email', async () => {
      let res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'notanemail',
          password: 'password123'
        })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test',
          email: 'login@example.com',
          password: 'password123'
        })
    })

    it('should login with valid credentials', async () => {
      let res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.token).toBeDefined()
    })

    it('should fail with wrong password', async () => {
      let res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })

      expect(res.statusCode).toBe(401)
    })

    it("should fail with non-existent email", async () => {
      let res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexist@example.com',
          password: 'password123'
        })

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should get profile with valid token', async () => {
      let registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile Test',
          email: 'profile@example.com',
          password: 'password123'
        })

      let token = registerRes.body.token

      let res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.data.name).toBe('Profile Test')
    })

    it('should fail without token', async () => {
      let res = await request(app).get('/api/auth/profile')
      expect(res.statusCode).toBe(401)
    })
  })
})
