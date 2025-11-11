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
Router.route('/profile')
  .put(authMiddleware.isAuthorized, userController.updateProfile)

Router.route('/change-password')
  .put(authMiddleware.isAuthorized, userController.changePassword)

export const userRoutes = Router
