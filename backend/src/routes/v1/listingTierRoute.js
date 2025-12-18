import express from 'express'
import { listingTierController } from '~/controllers/listingTierController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// All routes require authentication
Router.use(authMiddleware.isAuthorized)

Router.route('/')
  .get(listingTierController.getTiers)

export const listingTierRoutes = Router
