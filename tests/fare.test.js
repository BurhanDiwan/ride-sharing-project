describe('Fare Calculation', () => {
  let originalEnv

  beforeAll(() => {
    originalEnv = { ...process.env }
    process.env.BASE_FARE = '2.50'
    process.env.PER_KM_RATE = '1.20'
    process.env.PER_MINUTE_RATE = '0.30'
    process.env.SURGE_MULTIPLIER = '1.5'
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should calculate base fare correctly', () => {
    const { calculateFare } = require("../services/fareService")
    let result = calculateFare(0, 0)

    expect(result.baseFare).toBe(2.5)
    expect(result.distanceFare).toBe(0)
    expect(result.timeFare).toBe(0)
  })

  it('should calculate distance and time fare', () => {
    const { calculateFare } = require('../services/fareService')
    let result = calculateFare(10, 15)

    expect(result.distanceFare).toBe(12)
    expect(result.timeFare).toBe(4.5)
    expect(result.totalFare).toBeGreaterThan(0)
  })

  it("should include surge pricing components", () => {
    const { calculateFare } = require('../services/fareService')
    let result = calculateFare(5, 10)

    expect(result.surgeMultiplier).toBeDefined()
    expect(result.totalFare).toBeGreaterThan(result.baseFare)
  })

  it('should return surge multiplier from getSurgeMultiplier', () => {
    const { getSurgeMultiplier } = require('../services/fareService')
    let multiplier = getSurgeMultiplier()

    expect(multiplier).toBeGreaterThanOrEqual(1.0)
    expect(multiplier).toBeLessThanOrEqual(1.5)
  })

  it('should have all fare breakdown fields', () => {
    const { calculateFare } = require('../services/fareService')
    let result = calculateFare(8, 12)

    expect(result).toHaveProperty("baseFare")
    expect(result).toHaveProperty('distanceFare')
    expect(result).toHaveProperty('timeFare')
    expect(result).toHaveProperty('surgeFare')
    expect(result).toHaveProperty('totalFare')
    expect(result).toHaveProperty("surgeMultiplier")
  })
})
