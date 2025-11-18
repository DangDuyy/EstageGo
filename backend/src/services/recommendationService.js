import UserActivity from '../models/userActivity.js'
import propertyModel from '../models/properties.js'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'

// Content-Based Filtering: Recommend properties based on user's viewing history
const getPersonalizedRecommendations = async (userId, limit = 10) => {
  try {
    // 1. Get user's recent VIEW activities (last 10 views)
    const recentViews = await UserActivity.find({ 
      userId, 
      eventType: 'VIEW',
      propertyId: { $ne: null }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('propertyId')

    // If no viewing history, return popular properties
    if (recentViews.length === 0) {
      return getPopularProperties(limit)
    }

    // 2. Extract valid properties (filter out null/deleted properties)
    const viewedProperties = recentViews
      .map(v => v.propertyId)
      .filter(p => p && p.status === 'active')

    if (viewedProperties.length === 0) {
      return getPopularProperties(limit)
    }

    // 3. Analyze user preferences from viewed properties
    const preferences = analyzeUserPreferences(viewedProperties)

    // 4. Create list of viewed property IDs to exclude
    const viewedIds = viewedProperties.map(p => p._id)

    // 5. Build recommendation query based on preferences
    const recommendationQuery = buildRecommendationQuery(preferences, viewedIds)

    // 6. Get recommended properties
    const recommendations = await propertyModel
      .find(recommendationQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('owner', 'fullName userName avatar email phone role')

    return {
      recommendations,
      basedOn: preferences,
      totalViewed: viewedProperties.length
    }
  } catch (error) {
    throw error
  }
}

// Analyze user preferences from viewed properties
const analyzeUserPreferences = (properties) => {
  // Extract districts
  const districts = properties
    .map(p => p.address?.district)
    .filter(d => d)
  const uniqueDistricts = [...new Set(districts)]

  // Extract property types
  const types = properties
    .map(p => p.type)
    .filter(t => t)
  const uniqueTypes = [...new Set(types)]

  // Extract purposes (rent/sale)
  const purposes = properties
    .map(p => p.purpose)
    .filter(p => p)
  const uniquePurposes = [...new Set(purposes)]

  // Calculate average price
  const prices = properties.map(p => p.price?.value || 0).filter(p => p > 0)
  const avgPrice = prices.length > 0 
    ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
    : 0

  // Calculate average area
  const areas = properties.map(p => p.area?.value || 0).filter(a => a > 0)
  const avgArea = areas.length > 0 
    ? areas.reduce((sum, a) => sum + a, 0) / areas.length 
    : 0

  // Extract common features
  const allFeatures = properties
    .flatMap(p => p.features || [])
    .filter(f => f)
  const featureCount = {}
  allFeatures.forEach(f => {
    featureCount[f] = (featureCount[f] || 0) + 1
  })
  const commonFeatures = Object.keys(featureCount)
    .filter(f => featureCount[f] >= 2)

  return {
    districts: uniqueDistricts,
    types: uniqueTypes,
    purposes: uniquePurposes,
    priceRange: {
      min: avgPrice * 0.7,
      max: avgPrice * 1.3
    },
    areaRange: {
      min: avgArea * 0.7,
      max: avgArea * 1.3
    },
    commonFeatures
  }
}

// Build MongoDB query for recommendations
const buildRecommendationQuery = (preferences, excludeIds) => {
  const query = {
    _id: { $nin: excludeIds },
    status: 'active'
  }

  // Filter by districts (highest priority)
  if (preferences.districts.length > 0) {
    query['address.district'] = { $in: preferences.districts }
  }

  // Filter by property types
  if (preferences.types.length > 0) {
    query.type = { $in: preferences.types }
  }

  // Filter by purposes (rent/sale)
  if (preferences.purposes.length > 0) {
    query.purpose = { $in: preferences.purposes }
  }

  // Filter by price range (if avgPrice exists)
  if (preferences.priceRange.min > 0) {
    query['price.value'] = {
      $gte: preferences.priceRange.min,
      $lte: preferences.priceRange.max
    }
  }

  // Filter by area range (if avgArea exists)
  if (preferences.areaRange.min > 0) {
    query['area.value'] = {
      $gte: preferences.areaRange.min,
      $lte: preferences.areaRange.max
    }
  }

  // Filter by common features (optional boost)
  if (preferences.commonFeatures.length > 0) {
    query.features = { $in: preferences.commonFeatures }
  }

  return query
}

// Get popular properties as fallback
const getPopularProperties = async (limit = 10) => {
  try {
    // Get properties with most views in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const popularPropertyIds = await UserActivity.aggregate([
      {
        $match: {
          eventType: 'VIEW',
          propertyId: { $ne: null },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$propertyId',
          viewCount: { $sum: 1 }
        }
      },
      {
        $sort: { viewCount: -1 }
      },
      {
        $limit: limit
      }
    ])

    const propertyIds = popularPropertyIds.map(p => p._id)

    const properties = await propertyModel
      .find({
        _id: { $in: propertyIds },
        status: 'active'
      })
      .populate('owner', 'fullName userName avatar email phone role')

    return {
      recommendations: properties,
      basedOn: { type: 'popular' },
      totalViewed: 0
    }
  } catch (error) {
    // If aggregation fails, return latest properties
    const properties = await propertyModel
      .find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('owner', 'fullName userName avatar email phone role')

    return {
      recommendations: properties,
      basedOn: { type: 'latest' },
      totalViewed: 0
    }
  }
}

// Get similar properties based on a specific property
const getSimilarProperties = async (propertyId, limit = 6) => {
  try {
    const property = await propertyModel.findById(propertyId)
    
    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Property not found')
    }

    const query = {
      _id: { $ne: propertyId },
      status: 'active'
    }

    // Same district (high priority)
    if (property.address?.district) {
      query['address.district'] = property.address.district
    }

    // Same type
    if (property.type) {
      query.type = property.type
    }

    // Same purpose
    if (property.purpose) {
      query.purpose = property.purpose
    }

    // Similar price range (+/- 20%)
    if (property.price?.value) {
      query['price.value'] = {
        $gte: property.price.value * 0.8,
        $lte: property.price.value * 1.2
      }
    }

    const similarProperties = await propertyModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('owner', 'fullName userName avatar email phone role')

    return similarProperties
  } catch (error) {
    throw error
  }
}

// Track user activity
const trackActivity = async (activityData) => {
  try {
    const { userId, sessionId, eventType, propertyId, metadata } = activityData

    // Validate required fields
    if (!userId && !sessionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'userId or sessionId is required')
    }

    if (!eventType) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'eventType is required')
    }

    // Create activity record
    const activity = await UserActivity.create({
      userId: userId || null,
      sessionId: sessionId || null,
      eventType,
      propertyId: propertyId || null,
      metadata: metadata || {}
    })

    return activity
  } catch (error) {
    throw error
  }
}

// Get user activity history
const getUserActivityHistory = async (userId, limit = 50) => {
  try {
    const activities = await UserActivity
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('propertyId')

    return activities
  } catch (error) {
    throw error
  }
}

export const recommendationService = {
  getPersonalizedRecommendations,
  getSimilarProperties,
  trackActivity,
  getUserActivityHistory
}
