import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  eventType: {
    type: String,
    enum: ['VIEW', 'SEARCH', 'FILTER', 'WISHLIST_ADD', 'WISHLIST_REMOVE', 'CONTACT', 'CLICK'],
    required: true,
    index: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true,
  collection: 'user_activities'
})

userActivitySchema.index({ userId: 1, eventType: 1, createdAt: -1 })
userActivitySchema.index({ sessionId: 1, createdAt: -1 })
userActivitySchema.index({ propertyId: 1, eventType: 1 })

export default mongoose.model('UserActivity', userActivitySchema)
