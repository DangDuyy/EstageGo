import UserActivity from '../models/userActivity.js'
import propertyModel from '../models/properties.js'
import userModel from '../models/users.js'

/**
 * Collaborative Filtering Service - User-Based CF
 * Implementation based on: https://viblo.asia/p/xay-dung-collaborative-filtering-rs-recommender-system-co-ban-phan-3-Az45bMqolxY
 * 
 * Algorithm:
 * 1. Build User-Property Preference Matrix from UserActivity
 * 2. Calculate Cosine Similarity between users
 * 3. Find top-K similar users (neighbors)
 * 4. Predict ratings for properties user hasn't seen
 * 5. Return top-N recommendations
 */

// Event weights for Preference Matrix
const EVENT_WEIGHTS = {
  'WISHLIST_ADD': 5,    // Highest preference
  'CONTACT': 3,          // Serious interest
  'VIEW': 1              // Low interest (only if duration >= 10s)
}

/**
 * Build User-Property Preference Matrix
 * Matrix R[u][p] = total preference weight of user u for property p
 */
const buildPreferenceMatrix = async () => {
  try {
    // Get all activities with userId and propertyId
    const activities = await UserActivity.find({
      userId: { $ne: null },
      propertyId: { $ne: null },
      eventType: { $in: ['WISHLIST_ADD', 'CONTACT', 'VIEW'] }
    }).lean()

    const matrix = {}
    const allUserIds = new Set()
    const allPropertyIds = new Set()

    // Process each activity
    activities.forEach(activity => {
      const userId = activity.userId?.toString()
      const propertyId = activity.propertyId?.toString()
      
      if (!userId || !propertyId) return

      // Get weight for this event type
      let weight = EVENT_WEIGHTS[activity.eventType] || 0

      // For VIEW events, only count if duration >= 10s
      if (activity.eventType === 'VIEW' && activity.metadata?.duration) {
        if (activity.metadata.duration < 10) {
          return // Skip VIEW events < 10s
        }
      } else if (activity.eventType === 'VIEW' && !activity.metadata?.duration) {
        // If no duration metadata, assume it's valid (backend may have filtered already)
        weight = EVENT_WEIGHTS[activity.eventType]
      }

      if (weight === 0) return

      // Initialize user row if needed
      if (!matrix[userId]) {
        matrix[userId] = {}
      }

      // Sum weights for same user-property pair
      matrix[userId][propertyId] = (matrix[userId][propertyId] || 0) + weight
      
      allUserIds.add(userId)
      allPropertyIds.add(propertyId)
    })

    return {
      matrix,
      userIds: Array.from(allUserIds),
      propertyIds: Array.from(allPropertyIds)
    }
  } catch (error) {
    console.error('Error building preference matrix:', error)
    throw error
  }
}

/**
 * Calculate Cosine Similarity between two users
 * Sim(u, v) = (u · v) / (||u|| * ||v||)
 */
const cosineSimilarity = (vectorU, vectorV) => {
  const keys = Object.keys(vectorU)
  if (keys.length === 0) return 0

  let dotProduct = 0
  let normU = 0
  let normV = 0

  // Calculate for all properties that at least one user has interacted with
  const allKeys = new Set([...Object.keys(vectorU), ...Object.keys(vectorV)])

  allKeys.forEach(key => {
    const uValue = vectorU[key] || 0
    const vValue = vectorV[key] || 0

    dotProduct += uValue * vValue
    normU += uValue * uValue
    normV += vValue * vValue
  })

  const denominator = Math.sqrt(normU) * Math.sqrt(normV)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Calculate mean rating for each user (for normalization)
 * μ_u = average rating of user u
 */
const calculateUserMeans = (matrix) => {
  const means = {}
  
  Object.keys(matrix).forEach(userId => {
    const ratings = Object.values(matrix[userId])
    if (ratings.length === 0) {
      means[userId] = 0
      return
    }
    const sum = ratings.reduce((acc, r) => acc + r, 0)
    means[userId] = sum / ratings.length
  })
  
  return means
}

/**
 * Find top-K similar users for a specific user
 * Returns array of { userId, similarity } sorted by similarity descending
 */
const findSimilarUsers = (currentUserId, preferenceMatrix, allUserIds, kNeighbors = 50) => {
  try {
    const userMeans = calculateUserMeans(preferenceMatrix)
    const currentUserVector = preferenceMatrix[currentUserId] || {}
    const meanU = userMeans[currentUserId] || 0

    // Calculate normalized vector for current user
    const normalizedU = {}
    Object.keys(currentUserVector).forEach(key => {
      normalizedU[key] = currentUserVector[key] - meanU
    })

    const similarities = []

    // Calculate similarity with all other users
    for (const otherUserId of allUserIds) {
      if (otherUserId === currentUserId) continue // Skip self

      const otherUserVector = preferenceMatrix[otherUserId] || {}
      const meanV = userMeans[otherUserId] || 0

      // Calculate normalized vector for other user
      const normalizedV = {}
      const allKeys = new Set([...Object.keys(currentUserVector), ...Object.keys(otherUserVector)])

      allKeys.forEach(key => {
        normalizedV[key] = (otherUserVector[key] || 0) - meanV
      })

      const similarity = cosineSimilarity(normalizedU, normalizedV)
      if (similarity > 0) {
        similarities.push({ userId: otherUserId, similarity })
      }
    }

    // Sort by similarity descending and get top-K
    similarities.sort((a, b) => b.similarity - a.similarity)
    return similarities.slice(0, kNeighbors)
  } catch (error) {
    console.error('Error finding similar users:', error)
    throw error
  }
}

/**
 * Predict rating for user u on property j using Weighted Sum
 * P(u, j) = Σ(Sim(u, v) * R(v, j)) / Σ|Sim(u, v)|
 * 
 * Based on Viblo article formula
 */
const predictRating = (propertyId, preferenceMatrix, similarUsers) => {
  if (similarUsers.length === 0) return 0

  let weightedSum = 0
  let similaritySum = 0

  similarUsers.forEach(({ userId: similarUserId, similarity }) => {
    const rating = preferenceMatrix[similarUserId]?.[propertyId] || 0
    if (rating > 0) {
      weightedSum += similarity * rating
      similaritySum += Math.abs(similarity)
    }
  })

  if (similaritySum === 0) return 0

  return weightedSum / similaritySum
}

/**
 * Get Collaborative Filtering recommendations for a user
 */
const getCollaborativeFilteringRecommendations = async (userId, limit = 10) => {
  try {
    // Step 1: Build User-Property Preference Matrix
    const { matrix: preferenceMatrix, userIds, propertyIds } = await buildPreferenceMatrix()

    // Check if user has any interactions
    if (!preferenceMatrix[userId] || Object.keys(preferenceMatrix[userId]).length === 0) {
      return {
        recommendations: [],
        metadata: {
          algorithm: 'user-based-cf',
          similarUsersCount: 0,
          reason: 'user_no_interactions'
        }
      }
    }

    // Step 2: Find similar users for current user (only calculate for current user, not all users)
    const kNeighbors = 50 // Top 50 similar users
    const similarUsers = findSimilarUsers(userId, preferenceMatrix, userIds, kNeighbors)

    // If no similar users found, try to recommend properties based on what other users liked
    // (even without similarity score - this is a fallback mechanism)
    if (similarUsers.length === 0) {
      // Fallback: Recommend properties that are popular among all users (still CF-based)
      const allInteractedProperties = new Set()
      Object.values(preferenceMatrix).forEach(userPrefs => {
        Object.keys(userPrefs).forEach(propId => {
          allInteractedProperties.add(propId)
        })
      })

      // Get properties that other users liked (exclude user's own interactions)
      const userInteractedSet = new Set(Object.keys(preferenceMatrix[userId] || {}))
      const recommendedPropertyIds = Array.from(allInteractedProperties).filter(
        propId => !userInteractedSet.has(propId)
      )

      if (recommendedPropertyIds.length === 0) {
        return {
          recommendations: [],
          metadata: {
            algorithm: 'user-based-cf',
            similarUsersCount: 0,
            reason: 'no_similar_users_found',
            basedOn: { type: 'collaborative' }
          }
        }
      }

      // Get top properties by total interaction count across all users
      const propertyInteractionCounts = {}
      Object.values(preferenceMatrix).forEach(userPrefs => {
        Object.keys(userPrefs).forEach(propId => {
          if (!userInteractedSet.has(propId)) {
            propertyInteractionCounts[propId] = (propertyInteractionCounts[propId] || 0) + userPrefs[propId]
          }
        })
      })

      const topPropertyIds = Object.entries(propertyInteractionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([propId]) => propId)

      // Fetch property details
      const properties = await propertyModel
        .find({ _id: { $in: topPropertyIds }, status: 'active' })
        .populate('owner', 'fullName userName avatar email phone role')
        .lean()

      // Add prediction scores (use interaction count as proxy for prediction score)
      const propertiesWithScores = properties.map(property => {
        const interactionCount = propertyInteractionCounts[property._id.toString()] || 0
        return {
          ...property,
          predictionScore: interactionCount // Use interaction count as prediction score
        }
      }).sort((a, b) => b.predictionScore - a.predictionScore)

      return {
        recommendations: propertiesWithScores,
        metadata: {
          algorithm: 'user-based-cf',
          similarUsersCount: 0, // No similar users, but using collaborative data
          kNeighbors: 0,
          avgSimilarityScore: 0,
          totalInteractions: Object.keys(preferenceMatrix[userId] || {}).length,
          basedOn: {
            type: 'collaborative' // Still CF-based, just without similarity scores
          },
          reason: 'no_similar_users_found_using_popular_from_collaborative_data'
        }
      }
    }

    // Step 3: Get all active properties (optimize: fetch once instead of per-property)
    const activeProperties = await propertyModel
      .find({ 
        _id: { $in: propertyIds },
        status: 'active' 
      })
      .select('_id')
      .lean()

    const activePropertyIds = new Set(activeProperties.map(p => p._id.toString()))

    // Step 4: Predict ratings for all properties user hasn't seen
    const userInteractedProperties = new Set(Object.keys(preferenceMatrix[userId] || {}))
    
    const predictions = []
    for (const propertyId of propertyIds) {
      // Skip properties user has already interacted with
      if (userInteractedProperties.has(propertyId)) continue

      // Skip inactive properties
      if (!activePropertyIds.has(propertyId)) continue

      // Predict rating
      const predictedRating = predictRating(
        propertyId,
        preferenceMatrix,
        similarUsers
      )

      if (predictedRating > 0) {
        predictions.push({
          propertyId,
          predictionScore: predictedRating
        })
      }
    }

    // Step 5: Sort by prediction score and get top-K
    predictions.sort((a, b) => b.predictionScore - a.predictionScore)
    const topPredictions = predictions.slice(0, limit)

    // Step 6: Fetch property details
    const topPropertyIds = topPredictions.map(p => p.propertyId)
    const properties = await propertyModel
      .find({ _id: { $in: topPropertyIds }, status: 'active' })
      .populate('owner', 'fullName userName avatar email phone role')
      .lean()

    // Map properties with prediction scores
    const propertiesWithScores = properties.map(property => {
      const prediction = topPredictions.find(p => p.propertyId.toString() === property._id.toString())
      return {
        ...property,
        predictionScore: prediction?.predictionScore || 0
      }
    })

    // Calculate average similarity score
    const avgSimilarity = similarUsers.length > 0
      ? similarUsers.reduce((sum, u) => sum + u.similarity, 0) / similarUsers.length
      : 0

    // Count total interactions
    const totalInteractions = Object.keys(preferenceMatrix[userId] || {}).length

    return {
      recommendations: propertiesWithScores,
      metadata: {
        algorithm: 'user-based-cf',
        similarUsersCount: similarUsers.length,
        kNeighbors: kNeighbors,
        avgSimilarityScore: avgSimilarity,
        totalInteractions: totalInteractions,
        basedOn: {
          type: 'collaborative'
        }
      }
    }
  } catch (error) {
    console.error('Error in Collaborative Filtering:', error)
    throw error
  }
}

export const collaborativeFilteringService = {
  getCollaborativeFilteringRecommendations,
  buildPreferenceMatrix,
  findSimilarUsers
}

