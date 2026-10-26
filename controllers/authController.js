const User = require('../models/User')
const { validationResult } = require('express-validator')

exports.register = async (req, res) => {
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const { name, email, password, role, phone } = req.body

    let existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' })
    }

    let user = await User.create({
      name,
      email,
      password,
      role: role || 'rider',
      phone
    })

    let token = user.getSignedToken()

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.login = async function(req, res) {
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { email, password } = req.body

  try {
    let user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" })
    }

    let isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    let token = user.getSignedToken()

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user.id)
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.updateProfile = async function(req, res) {
  try {
    let fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone
    }

    if (req.body.vehicleInfo) {
      fieldsToUpdate.vehicleInfo = req.body.vehicleInfo
    }

    let user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    })

    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
