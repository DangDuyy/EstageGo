import express from 'express'
import { listingTierController } from '~/controllers/listingTierController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// All routes require authentication
Router.use(authMiddleware.isAuthorized)

// Usage stats (đặt trước để tránh conflict)
Router.get('/stats/usage', listingTierController.getUsageStats)

Router.route('/')
  .get(listingTierController.getTiers)
  .post(listingTierController.createTier)

Router.route('/:tierName')
  .put(listingTierController.updateTier)

Router.put('/:tierName/pricing', listingTierController.updateTierPricing)

Router.patch('/:tierName/deactivate', listingTierController.deactivateTier)
Router.patch('/:tierName/activate', listingTierController.activateTier)

export const listingTierRoutes = Router
