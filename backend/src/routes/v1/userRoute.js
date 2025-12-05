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

// ✅ Verify phone OTP (sau khi đăng ký)
Router.route('/phone/verify-registration')
  .post(userController.verifyPhoneRegistration)

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

// Phone verification endpoints
// ✅ Không cần auth cho registration, có auth cho profile update
Router.route('/phone/send-code')
  .post(userController.sendPhoneVerification)

Router.route('/phone/verify')
  .post(authMiddleware.isAuthorized, userController.verifyPhoneCode)

Router.route('/upgrade-membership')
  .post(authMiddleware.isAuthorized, userController.upgradeMembership)

export const userRoutes = Router
