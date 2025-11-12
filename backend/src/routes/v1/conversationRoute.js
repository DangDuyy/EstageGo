import express from 'express'
import { conversationController } from '~/controllers/conversationController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// All routes require authentication
Router.use(authMiddleware.isAuthorized)

// Create or get conversation with another user
Router.route('/')
  .post(conversationController.createOrGetConversation)
  .get(conversationController.getUserConversations)

// Get conversation by ID
Router.route('/:conversationId')
  .get(conversationController.getConversationById)

export const conversationRoutes = Router
