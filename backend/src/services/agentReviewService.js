import agentReviewModel from '~/models/agentReviews'
import userModel from '~/models/users'
import { Types } from 'mongoose'
import { createAndEmitNotification } from './notificationService'

// Get all reviews for an agent
const getAgentReviews = async (agentId, page = 1, limit = 10) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID')
    }

    // Check if agent exists and is an agent
    const agent = await userModel.findById(agentId)
    if (!agent || agent.role !== 'agent') {
      throw new Error('Agent not found')
    }

    const skip = (page - 1) * limit

    const reviews = await agentReviewModel
      .find({ agent: agentId, _destroy: false })
      .populate('reviewer', 'fullName userName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await agentReviewModel.countDocuments({ agent: agentId, _destroy: false })

    // Calculate average rating
    const ratingStats = await agentReviewModel.aggregate([
      { $match: { agent: new Types.ObjectId(agentId), _destroy: false } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ])

    let stats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }

    if (ratingStats.length > 0) {
      const stat = ratingStats[0]
      stats.averageRating = Math.round(stat.averageRating * 10) / 10
      stats.totalReviews = stat.totalReviews
      
      // Calculate distribution
      stat.ratingDistribution.forEach(rating => {
        if (rating >= 1 && rating <= 5) {
          stats.ratingDistribution[rating] = (stats.ratingDistribution[rating] || 0) + 1
        }
      })
    }

    return {
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    }
  } catch (error) {
    throw error
  }
}

// Get single review by ID
const getReviewById = async (reviewId) => {
  try {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new Error('Invalid review ID')
    }

    const review = await agentReviewModel
      .findById(reviewId)
      .populate('reviewer', 'fullName userName avatar')
      .populate('agent', 'fullName userName avatar role')

    if (!review || review._destroy) {
      throw new Error('Review not found')
    }

    return {
      success: true,
      review
    }
  } catch (error) {
    throw error
  }
}

// Create a review
const createReview = async (reviewerId, agentId, { rating, comment, media = [] }) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID')
    }

    if (reviewerId.toString() === agentId.toString()) {
      throw new Error('Cannot review yourself')
    }

    // Check if agent exists and is an agent
    const agent = await userModel.findById(agentId)
    if (!agent || agent.role !== 'agent') {
      throw new Error('Agent not found')
    }

    const review = await agentReviewModel.create({
      reviewer: reviewerId,
      agent: agentId,
      rating,
      comment: comment || null,
      media: media || []
    })

    await review.populate('reviewer', 'fullName userName avatar')

    // Send notification to agent
    const reviewer = await userModel.findById(reviewerId).select('fullName userName')
    await createAndEmitNotification(agentId, {
      type: 'PROPERTY',
      title: 'New Review Received',
      message: `${reviewer.fullName || reviewer.userName} left you a ${rating}-star review`,
      meta: {
        reviewId: review._id,
        agentId: agentId,
        reviewerId: reviewerId,
        rating: rating
      }
    })

    return {
      success: true,
      message: 'Review created successfully',
      review
    }
  } catch (error) {
    throw error
  }
}

// Update a review
const updateReview = async (reviewId, reviewerId, { rating, comment, media }) => {
  try {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new Error('Invalid review ID')
    }

    const review = await agentReviewModel.findById(reviewId)

    if (!review || review._destroy) {
      throw new Error('Review not found')
    }

    if (review.reviewer.toString() !== reviewerId.toString()) {
      throw new Error('Not authorized to update this review')
    }

    // Update fields
    if (rating !== undefined) review.rating = rating
    if (comment !== undefined) review.comment = comment || null
    if (media !== undefined) review.media = media || []

    await review.save()
    await review.populate('reviewer', 'fullName userName avatar')

    // Send notification to agent
    const agent = await userModel.findById(review.agent).select('fullName userName')
    const reviewer = await userModel.findById(reviewerId).select('fullName userName')
    await createAndEmitNotification(review.agent, {
      type: 'PROPERTY',
      title: 'Review Updated',
      message: `${reviewer.fullName || reviewer.userName} updated their review`,
      meta: {
        reviewId: review._id,
        agentId: review.agent,
        reviewerId: reviewerId,
        rating: review.rating
      }
    })

    return {
      success: true,
      message: 'Review updated successfully',
      review
    }
  } catch (error) {
    throw error
  }
}

// Delete a review (soft delete)
const deleteReview = async (reviewId, userId, isAdmin = false) => {
  try {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new Error('Invalid review ID')
    }

    const review = await agentReviewModel.findById(reviewId)

    if (!review || review._destroy) {
      throw new Error('Review not found')
    }

    // Check authorization: reviewer or admin can delete
    if (!isAdmin && review.reviewer.toString() !== userId.toString()) {
      throw new Error('Not authorized to delete this review')
    }

    review._destroy = true
    await review.save()

    return {
      success: true,
      message: 'Review deleted successfully'
    }
  } catch (error) {
    throw error
  }
}

// Get user's review for an agent
const getUserReviewForAgent = async (userId, agentId) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID')
    }

    const review = await agentReviewModel
      .findOne({
        reviewer: userId,
        agent: agentId,
        _destroy: false
      })
      .populate('reviewer', 'fullName userName avatar')

    return {
      success: true,
      review: review || null
    }
  } catch (error) {
    throw error
  }
}

// Get all recent reviews for homepage
const getAllRecentReviews = async (limit = 6) => {
  try {
    const reviews = await agentReviewModel
      .find({ _destroy: false })
      .populate('reviewer', 'fullName userName avatar')
      .populate('agent', 'fullName userName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return {
      success: true,
      reviews
    }
  } catch (error) {
    throw error
  }
}

export const agentReviewService = {
  getAgentReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getUserReviewForAgent,
  getAllRecentReviews
}

