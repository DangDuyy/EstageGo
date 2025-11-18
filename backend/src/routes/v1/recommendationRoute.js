import express from 'express'
import { recommendationController } from '../../controllers/recommendationController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const Router = express.Router()

// Get personalized recommendations (requires auth)
Router.route('/personalized')
  .get(authMiddleware.isAuthorized, recommendationController.getPersonalizedRecommendations)

// Get similar properties (public)
Router.route('/similar/:propertyId')
  .get(recommendationController.getSimilarProperties)

// Track activity (optional auth - works for both logged in and guest users)
Router.route('/track')
  .post(authMiddleware.isOptionallyAuthorized, recommendationController.trackActivity)

// Get user activity history (requires auth, for debugging)
Router.route('/history')
  .get(authMiddleware.isAuthorized, recommendationController.getUserActivityHistory)

export const recommendationRoutes = Router
