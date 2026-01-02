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
      data: result.recommendations || [],
      meta: {
        basedOn: result.basedOn || {},
        totalViewed: result.totalViewed || 0,
        totalInteractions: result.totalViewed || 0,
        count: result.recommendations?.length || 0,
        // Add CF metadata if available
        ...(result.metadata || {}),
        algorithm: result.metadata?.algorithm || 'user-based-cf',
        similarUsersCount: result.metadata?.similarUsersCount || 0,
        avgSimilarityScore: result.metadata?.avgSimilarityScore || 0,
        kNeighbors: result.metadata?.kNeighbors || 0
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
    // Handle both authenticated and guest users
    const userId = (req.jwtDecoded && req.jwtDecoded._id) ? req.jwtDecoded._id : null
    const { sessionId, eventType, propertyId, metadata } = req.body

    // Validate eventType
    const validEventTypes = ['VIEW', 'SEARCH', 'FILTER', 'WISHLIST_ADD', 'WISHLIST_REMOVE', 'CONTACT', 'CLICK', 'SHARE']
    if (!validEventTypes.includes(eventType)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`)
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || (req.sessionID ? req.sessionID : `session_${Date.now()}_${Math.random().toString(36).substring(7)}`)

    const activity = await recommendationService.trackActivity({
      userId,
      sessionId: finalSessionId,
      eventType,
      propertyId: propertyId || null,
      metadata: metadata || {}
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
