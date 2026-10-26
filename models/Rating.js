const mongoose = require('mongoose')

let ratingSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true })

ratingSchema.index({ driver: 1 })
ratingSchema.index({ ride: 1, rider: 1 }, { unique: true })

ratingSchema.statics.calculateAverageRating = async function(driverId) {
  let result = await this.aggregate([
    { $match: { driver: driverId } },
    {
      $group: {
        _id: '$driver',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ])

  const User = require('./User')

  if (result.length > 0) {
    await User.findByIdAndUpdate(driverId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10
    })
  } else {
    await User.findByIdAndUpdate(driverId, { averageRating: 0 })
  }
}

ratingSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.driver)
})

module.exports = mongoose.model("Rating", ratingSchema)
