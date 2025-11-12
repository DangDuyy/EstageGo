import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct'],
    default: 'direct',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    messageId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Message', 
      default: null 
    },
    text: { type: String, default: '' },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
    createdAt: { type: Date, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Index để tìm conversation giữa 2 users nhanh
conversationSchema.index({ participants: 1 })

// Middleware update updatedAt
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

const conversationModel = mongoose.model('Conversation', conversationSchema)
export default conversationModel
