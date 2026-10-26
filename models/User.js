const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

let userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider'
  },
  phone: {
    type: String,
    maxlength: 15
  },
  location: {
    type: { type: String, enum: ['Point'], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    licensePlate: String,
    color: String
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

userSchema.index({ location: "2dsphere" })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  let salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getSignedToken = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  })
}

module.exports = mongoose.model("User", userSchema)
