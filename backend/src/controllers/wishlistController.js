import { StatusCodes } from 'http-status-codes'
import { wishlistService } from '~/services/wishlistService'

// Get user's wishlist
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await wishlistService.getUserWishlist(userId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Add property to wishlist
const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { propertyId } = req.body

    if (!propertyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Property ID is required'
      })
    }

    const result = await wishlistService.addToWishlist(userId, propertyId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message === 'Property already in wishlist') {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

// Remove property from wishlist
const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { propertyId } = req.params

    const result = await wishlistService.removeFromWishlist(userId, propertyId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Check if property is in wishlist
const checkWishlist = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { propertyId } = req.params

    const result = await wishlistService.isInWishlist(userId, propertyId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Toggle wishlist (add/remove)
const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { propertyId } = req.body

    if (!propertyId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Property ID is required'
      })
    }

    const result = await wishlistService.toggleWishlist(userId, propertyId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const wishlistController = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  toggleWishlist
}
