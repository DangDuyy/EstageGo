import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: false,
    trim: true
  },
  // Optional attachments (images, files, audio, video, ...)
  attachments: [
    {
      url: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['image', 'file', 'audio', 'video'],
        default: 'file'
      },
      filename: String,
      mimetype: String,
      size: Number
    }
  ],
  // Simple type flag to distinguish text vs media messages on FE if needed
  messageType: {
    type: String,
    enum: ['text', 'media', 'mixed'],
    default: 'text'
  },
  // Reactions: simple emoji per user
  reactions: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      emoji: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Soft delete per user
  deletedFor: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      deletedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  // Recall flag: message content hidden for everyone
  recalled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

// Index để query messages nhanh
messageSchema.index({ conversationId: 1, createdAt: -1 })

const messageModel = mongoose.model('Message', messageSchema)
export default messageModel
