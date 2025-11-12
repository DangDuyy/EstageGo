import express from 'express'
import { messageController } from '~/controllers/messageController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// All routes require authentication
Router.use(authMiddleware.isAuthorized)

// Send message
Router.route('/')
  .post(messageController.sendMessage)

// Get messages in a conversation
Router.route('/:conversationId')
  .get(messageController.getMessages)

export const messageRoutes = Router
