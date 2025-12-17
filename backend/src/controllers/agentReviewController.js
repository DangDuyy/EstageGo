import { StatusCodes } from 'http-status-codes'
import { agentReviewService } from '~/services/agentReviewService'
import { mediaService } from '~/services/mediaService'

// Get all reviews for an agent
const getAgentReviews = async (req, res, next) => {
  try {
    const { agentId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const result = await agentReviewService.getAgentReviews(agentId, page, limit)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Get single review by ID
const getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const result = await agentReviewService.getReviewById(reviewId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Create a review
const createReview = async (req, res, next) => {
  try {
    const reviewerId = req.jwtDecoded._id
    const { agentId } = req.params
    const { rating, comment, media } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5'
      })
    }

    const result = await agentReviewService.createReview(reviewerId, agentId, {
      rating,
      comment,
      media
    })
    
    return res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    if (error.message === 'Cannot review yourself' || 
        error.message === 'Agent not found' ||
        error.message === 'You have already reviewed this agent') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

// Update a review
const updateReview = async (req, res, next) => {
  try {
    const reviewerId = req.jwtDecoded._id
    const { reviewId } = req.params
    const { rating, comment, media } = req.body

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }

    const result = await agentReviewService.updateReview(reviewId, reviewerId, {
      rating,
      comment,
      media
    })
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message === 'Review not found' || 
        error.message === 'Not authorized to update this review') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

// Delete a review
const deleteReview = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const userRole = req.jwtDecoded.role
    const { reviewId } = req.params
    const isAdmin = userRole === 'admin'

    const result = await agentReviewService.deleteReview(reviewId, userId, isAdmin)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message === 'Review not found' || 
        error.message === 'Not authorized to delete this review') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

// Get user's review for an agent
const getUserReviewForAgent = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { agentId } = req.params

    const result = await agentReviewService.getUserReviewForAgent(userId, agentId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Upload review images
const uploadReviewImages = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const files = req.files || []

    if (!files || files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No files provided'
      })
    }

    const uploadResult = await mediaService.uploadReviewImages(files, userId)
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Images uploaded successfully',
      media: uploadResult
    })
  } catch (error) {
    next(error)
  }
}

// Get all recent reviews for homepage
const getAllRecentReviews = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6
    const result = await agentReviewService.getAllRecentReviews(limit)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const agentReviewController = {
  getAgentReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getUserReviewForAgent,
  uploadReviewImages,
  getAllRecentReviews
}


