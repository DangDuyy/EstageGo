import { StatusCodes } from "http-status-codes"
import messageModel from "~/models/messages"
import conversationModel from "~/models/conversations"
import ApiError from "~/utils/ApiError"
import { conversationService } from "./conversationService"

/**
 * Send a message in a conversation
 */
const sendMessage = async ({ conversationId, senderId, text, io }) => {
  try {
    // Verify conversation exists and user is participant
    const conversation = await conversationModel.findOne({
      _id: conversationId,
      participants: senderId
    })

    if (!conversation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found or you are not a participant')
    }

    // Create message
    const message = await messageModel.create({
      conversationId,
      senderId,
      text
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

    return message
  } catch (error) {
    throw error
  }
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

    const messages = await messageModel.find({ conversationId })
      .populate('senderId', '_id userName fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await messageModel.countDocuments({ conversationId })

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

export const messageService = {
  sendMessage,
  getMessages
}
