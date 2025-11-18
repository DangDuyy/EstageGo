import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional - for guest users we use sessionId instead
    default: null,
    index: true
  },
  sessionId: {
    type: String,
    required: false, // At least one of userId or sessionId must be present (validated in service)
    default: null,
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

// Indexes for efficient querying
userActivitySchema.index({ userId: 1, eventType: 1, createdAt: -1 }, { sparse: true }) // Sparse index for userId (since it can be null)
userActivitySchema.index({ sessionId: 1, createdAt: -1 }, { sparse: true }) // Sparse index for sessionId
userActivitySchema.index({ propertyId: 1, eventType: 1 }, { sparse: true })
userActivitySchema.index({ createdAt: -1 }) // For general time-based queries

export default mongoose.model('UserActivity', userActivitySchema)
