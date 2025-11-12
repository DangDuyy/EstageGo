import { StatusCodes } from "http-status-codes"
import mongoose from "mongoose"
import conversationModel from "~/models/conversations"
import messageModel from "~/models/messages"
import userModel from "~/models/users"
import ApiError from "~/utils/ApiError"

/**
 * Find or create a direct conversation between two users
 */
const findOrCreateDirectConversation = async (userId1, userId2) => {
  try {
    // Find existing conversation
    let conversation = await conversationModel.findOne({
      type: 'direct',
      participants: { $all: [userId1, userId2], $size: 2 }
    })
    .populate('participants', '_id userName fullName avatar')
    .populate('lastMessage.senderId', '_id userName fullName avatar')

    if (conversation) {
      return conversation
    }

    // Create new conversation
    conversation = await conversationModel.create({
      type: 'direct',
      participants: [userId1, userId2]
    })

    conversation = await conversation.populate('participants', '_id userName fullName avatar')
    return conversation
  } catch (error) {
    throw error
  }
}

/**
 * Get all conversations for a user
 */
const getUserConversations = async (userId) => {
  try {
    const conversations = await conversationModel.find({
      participants: userId
    })
    .populate('participants', '_id userName fullName avatar')
    .populate('lastMessage.senderId', '_id userName fullName avatar')
    .sort({ updatedAt: -1 })

    return conversations
  } catch (error) {
    throw error
  }
}

/**
 * Get conversation by ID
 */
const getConversationById = async (conversationId, userId) => {
  try {
    const conversation = await conversationModel.findOne({
      _id: conversationId,
      participants: userId
    })
    .populate('participants', '_id userName fullName avatar')
    .populate('lastMessage.senderId', '_id userName fullName avatar')

    if (!conversation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found')
    }

    return conversation
  } catch (error) {
    throw error
  }
}

/**
 * Update last message in conversation
 */
const updateLastMessage = async (conversationId, message) => {
  try {
    await conversationModel.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: {
          messageId: message._id,
          text: message.text,
          senderId: message.senderId,
          createdAt: message.createdAt
        },
        updatedAt: Date.now()
      }
    )
  } catch (error) {
    throw error
  }
}

export const conversationService = {
  findOrCreateDirectConversation,
  getUserConversations,
  getConversationById,
  updateLastMessage
}
