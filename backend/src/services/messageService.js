import { StatusCodes } from "http-status-codes"
import messageModel from "~/models/messages"
import conversationModel from "~/models/conversations"
import ApiError from "~/utils/ApiError"
import { conversationService } from "./conversationService"
import { cloudinary } from "~/config/cloudinary"

const uploadBufferToCloudinary = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: options.folder,
        public_id: options.public_id
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )

    stream.end(file.buffer)
  })
}

/**
 * Send a message in a conversation
 * Supports text-only, media-only, or mixed (text + attachments)
 */
const sendMessage = async ({ conversationId, senderId, text, files = [], io }) => {
  try {
    // Verify conversation exists and user is participant
    const conversation = await conversationModel.findOne({
      _id: conversationId,
      participants: senderId
    })

    if (!conversation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found or you are not a participant')
    }

    // Upload attachments (if any)
    let attachments = []
    if (Array.isArray(files) && files.length > 0) {
      const folder = `estagego/messages/${conversationId}`
      const uploadResults = await Promise.all(
        files.map((file) =>
          uploadBufferToCloudinary(file, {
            folder,
            public_id: `${Date.now()}_${file.originalname}`
          })
        )
      )

      attachments = uploadResults.map((r, idx) => {
        const f = files[idx]
        const mime = f.mimetype || r.resource_type
        let type = 'file'
        if (mime?.startsWith('image/')) type = 'image'
        else if (mime?.startsWith('audio/')) type = 'audio'
        else if (mime?.startsWith('video/')) type = 'video'

        return {
          url: r.secure_url,
          type,
          filename: f.originalname,
          mimetype: mime,
          size: f.size
        }
      })
    }

    const trimmedText = typeof text === 'string' ? text.trim() : ''
    const hasText = !!trimmedText
    const hasAttachments = attachments.length > 0

    const messageType = hasText && hasAttachments
      ? 'mixed'
      : hasAttachments
        ? 'media'
        : 'text'

    // Create message
    const message = await messageModel.create({
      conversationId,
      senderId,
      text: trimmedText || undefined,
      attachments: attachments.length ? attachments : undefined,
      messageType
    })

    // Populate sender info
    await message.populate('senderId', '_id userName fullName avatar')

    // Update last message in conversation
    await conversationService.updateLastMessage(conversationId, message)

    // Emit realtime event
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:new', {
        conversationId,
        message: message.toObject()
      })
    }

    return { message, conversation }
  } catch (error) {
    throw error
  }
}

/**
 * Toggle a reaction (emoji) on a message for a given user.
 * If same emoji already exists for that user → remove it.
 * If different emoji exists → update to new emoji.
 */
const toggleReaction = async ({ messageId, userId, emoji, io }) => {
  const message = await messageModel.findById(messageId)
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Message not found')
  }

  // Ensure user is in the same conversation
  const conversation = await conversationModel.findOne({
    _id: message.conversationId,
    participants: userId
  })
  if (!conversation) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this conversation')
  }

  const reactions = message.reactions || []
  const idx = reactions.findIndex(
    (r) => String(r.userId) === String(userId)
  )

  if (idx !== -1 && reactions[idx].emoji === emoji) {
    // Same emoji → remove reaction
    reactions.splice(idx, 1)
  } else if (idx !== -1) {
    // Different emoji → update
    reactions[idx].emoji = emoji
    reactions[idx].createdAt = new Date()
  } else {
    // New reaction
    reactions.push({ userId, emoji, createdAt: new Date() })
  }

  message.reactions = reactions
  await message.save()

  // Emit realtime update
  if (io) {
    io.to(`conversation:${message.conversationId}`).emit('message:reaction', {
      conversationId: message.conversationId,
      messageId: message._id,
      reactions: message.reactions
    })
  }

  return message
}

/**
 * Get messages in a conversation with pagination
 */
const getMessages = async ({ conversationId, userId, page = 1, limit = 50 }) => {
  try {
    // Verify conversation exists and user is participant
    const conversation = await conversationModel.findOne({
      _id: conversationId,
      participants: userId
    })

    if (!conversation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found or you are not a participant')
    }

    const skip = (page - 1) * limit

    const messages = await messageModel.find({
      conversationId,
      'deletedFor.userId': { $ne: userId }
    })
      .populate('senderId', '_id userName fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await messageModel.countDocuments({
      conversationId,
      'deletedFor.userId': { $ne: userId }
    })

    return {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

// Soft delete message for a specific user (hide only for that user)
const deleteForUser = async ({ messageId, userId }) => {
  const message = await messageModel.findById(messageId)
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Message not found')
  }

  const conversation = await conversationModel.findOne({
    _id: message.conversationId,
    participants: userId
  })
  if (!conversation) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this conversation')
  }

  const deletedFor = message.deletedFor || []
  const already = deletedFor.some((d) => String(d.userId) === String(userId))
  if (!already) {
    deletedFor.push({ userId, deletedAt: new Date() })
    message.deletedFor = deletedFor
    await message.save()
  }

  return { ok: true }
}

// Recall message for everyone (only sender can recall)
const recallMessage = async ({ messageId, userId, io }) => {
  const message = await messageModel.findById(messageId)
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Message not found')
  }

  if (String(message.senderId) !== String(userId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only sender can recall this message')
  }

  message.recalled = true
  await message.save()

  if (io) {
    io.to(`conversation:${message.conversationId}`).emit('message:recalled', {
      conversationId: message.conversationId,
      messageId: message._id
    })
  }

  return message
}

export const messageService = {
  sendMessage,
  getMessages,
  toggleReaction,
  deleteForUser,
  recallMessage
}
