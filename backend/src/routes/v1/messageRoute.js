import express from 'express'
import { messageController } from '~/controllers/messageController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles } from '~/middlewares/uploadMiddleware'

const Router = express.Router()

// All routes require authentication
Router.use(authMiddleware.isAuthorized)

// Send message (supports text + optional attachments via multipart/form-data)
Router.route('/')
  .post(uploadFiles, messageController.sendMessage)

// Get messages in a conversation
Router.route('/:conversationId')
  .get(messageController.getMessages)

// Get conversation media by type
Router.route('/:conversationId/media')
  .get(messageController.getConversationMedia)

// Toggle reaction on a message
Router.route('/:messageId/reactions')
  .post(messageController.toggleReaction)

// Delete message for current user
Router.route('/:messageId')
  .delete(messageController.deleteMessageForMe)

// Recall message for everyone
Router.route('/:messageId/recall')
  .post(messageController.recallMessage)

export const messageRoutes = Router
