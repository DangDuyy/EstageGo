import express from 'express'
import { vapiController } from '~/controllers/vapiController.js'
import { authMiddleware } from '~/middlewares/authMiddleware.js'

const Router = express.Router()

/**
 * @route   POST /api/v1/vapi/chat
 * @desc    Chat with AI assistant (enhanced with database + route knowledge)
 * @access  Public (but enhanced if authenticated)
 */
Router.post('/chat', authMiddleware.isOptionallyAuthorized, vapiController.chat)

/**
 * @route   POST /api/v1/vapi/stream-chat
 * @desc    Stream chat response in real-time
 * @access  Public (but enhanced if authenticated)
 */
Router.post('/stream-chat', authMiddleware.isOptionallyAuthorized, vapiController.streamChat)

/**
 * @route   POST /api/v1/vapi/execute-function
 * @desc    Execute a specific function (searchProperties, getNavigationRoute, etc.)
 * @access  Public
 */
Router.post('/execute-function', vapiController.executeFunction)

/**
 * @route   GET /api/v1/vapi/functions
 * @desc    Get available function definitions
 * @access  Public
 */
Router.get('/functions', vapiController.getFunctions)

/**
 * @route   POST /api/v1/vapi/context
 * @desc    Get system context (for debugging)
 * @access  Public
 */
Router.post('/context', authMiddleware.isOptionallyAuthorized, vapiController.getContext)

/**
 * @route   GET /api/v1/vapi/greeting
 * @desc    Get greeting message for voice assistant
 * @access  Public (but personalized if authenticated)
 */
Router.get('/greeting', authMiddleware.isOptionallyAuthorized, vapiController.getGreeting)

/**
 * @route   GET /api/v1/vapi/health
 * @desc    Health check
 * @access  Public
 */
Router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VAPI service is running',
    timestamp: new Date().toISOString()
  })
})

export const vapiRoutes = Router
