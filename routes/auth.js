const express = require('express')
const router = express.Router()
const { body } = require("express-validator")
const { register, login, getProfile, updateProfile } = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body("email").isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['rider', 'driver']).withMessage("Role must be rider or driver")
], register)

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage("Password is required")
], login)

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)

module.exports = router
