import { StatusCodes } from 'http-status-codes'
import { recommendationService } from '../services/recommendationService.js'
import ApiError from '../utils/ApiError.js'

// Get personalized recommendations for logged-in user
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { limit = 10 } = req.query

    const result = await recommendationService.getPersonalizedRecommendations(
      userId,
      parseInt(limit)
    )

    res.status(StatusCodes.OK).json({
      success: true,
      data: result.recommendations,
      meta: {
        basedOn: result.basedOn,
        totalViewed: result.totalViewed,
        count: result.recommendations.length
      }
    })
  } catch (error) {
    next(error)
  }
}

// Get similar properties based on a specific property
const getSimilarProperties = async (req, res, next) => {
  try {
    const { propertyId } = req.params
    const { limit = 6 } = req.query

    const properties = await recommendationService.getSimilarProperties(
      propertyId,
      parseInt(limit)
    )

    res.status(StatusCodes.OK).json({
      success: true,
      data: properties,
      count: properties.length
    })
  } catch (error) {
    next(error)
  }
}

// Track user activity
const trackActivity = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded?._id || null
    const { sessionId, eventType, propertyId, metadata } = req.body

    // Validate eventType
    const validEventTypes = ['VIEW', 'SEARCH', 'FILTER', 'WISHLIST_ADD', 'WISHLIST_REMOVE', 'CONTACT', 'CLICK']
    if (!validEventTypes.includes(eventType)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`)
    }

    const activity = await recommendationService.trackActivity({
      userId,
      sessionId: sessionId || req.sessionID || `session_${Date.now()}`,
      eventType,
      propertyId,
      metadata
    })

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Activity tracked successfully',
      data: activity
    })
  } catch (error) {
    next(error)
  }
}

// Get user activity history (for debugging/analytics)
const getUserActivityHistory = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { limit = 50 } = req.query

    const activities = await recommendationService.getUserActivityHistory(
      userId,
      parseInt(limit)
    )

    res.status(StatusCodes.OK).json({
      success: true,
      data: activities,
      count: activities.length
    })
  } catch (error) {
    next(error)
  }
}

export const recommendationController = {
  getPersonalizedRecommendations,
  getSimilarProperties,
  trackActivity,
  getUserActivityHistory
}
