import express from 'express'
import { userController } from '~/controllers/userController'
import { userValidation } from '~/validations/userValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/register')
  .post(userValidation.createNew, userController.createNew)

Router.route('/login')
  .post(userValidation.login, userController.login)

Router.route('/verify')
  .put(userValidation.verifyAccount, userController.verifyAccount)

Router.route('/refresh-token')
  .get(userController.refreshToken)

Router.route('/logout')
  .delete(userController.logout)

// Protected routes (require authentication)
Router.route('/me')
  .get(authMiddleware.isAuthorized, userController.getCurrentUser)

Router.route('/profile')
  .put(authMiddleware.isAuthorized, userController.updateProfile)

Router.route('/change-password')
  .put(authMiddleware.isAuthorized, userController.changePassword)

// Agent routes
Router.route('/agents')
  .get(userController.getAllAgents)

Router.route('/agents/:agentId')
  .get(userController.getAgentById)

// Public user profile (for both agents and personal users)
Router.route('/profile/:userId')
  .get(userController.getUserProfileById)

Router.route('/request-agent')
  .post(authMiddleware.isAuthorized, userController.requestAgentRole)

Router.route('/remove-agent')
  .delete(authMiddleware.isAuthorized, userController.removeAgentRole)

export const userRoutes = Router
