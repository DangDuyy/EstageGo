import express from 'express'
import { wishlistController } from '~/controllers/wishlistController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// All routes require authentication
Router.use(authMiddleware.isAuthorized)

// GET /api/v1/wishlist - Get user's wishlist
Router.get('/', wishlistController.getWishlist)

// POST /api/v1/wishlist/toggle - Toggle property in wishlist
Router.post('/toggle', wishlistController.toggleWishlist)

// POST /api/v1/wishlist - Add property to wishlist
Router.post('/', wishlistController.addToWishlist)

// DELETE /api/v1/wishlist - Clear all properties from wishlist (must be before /:propertyId route)
Router.delete('/', wishlistController.clearAllWishlist)

// DELETE /api/v1/wishlist/:propertyId - Remove property from wishlist
Router.delete('/:propertyId', wishlistController.removeFromWishlist)

// GET /api/v1/wishlist/check/:propertyId - Check if property is in wishlist
Router.get('/check/:propertyId', wishlistController.checkWishlist)

export const wishlistRoute = Router
