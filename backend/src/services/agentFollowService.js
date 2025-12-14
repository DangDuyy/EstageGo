import agentFollowModel from '~/models/agentFollows'
import userModel from '~/models/users'
import { Types } from 'mongoose'
import { createAndEmitNotification } from './notificationService'

// Get all followers for an agent
const getAgentFollowers = async (agentId, page = 1, limit = 20) => {
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

    const follows = await agentFollowModel
      .find({ agent: agentId, _destroy: false })
      .populate('follower', 'fullName userName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await agentFollowModel.countDocuments({ agent: agentId, _destroy: false })

    return {
      success: true,
      followers: follows.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

// Get all agents a user is following
const getUserFollowing = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit

    const follows = await agentFollowModel
      .find({ follower: userId, _destroy: false })
      .populate('agent', 'fullName userName avatar role companyName agentTitle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await agentFollowModel.countDocuments({ follower: userId, _destroy: false })

    return {
      success: true,
      following: follows.map(f => f.agent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

// Follow an agent
const followAgent = async (followerId, agentId) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID')
    }

    if (followerId.toString() === agentId.toString()) {
      throw new Error('Cannot follow yourself')
    }

    // Check if agent exists and is an agent
    const agent = await userModel.findById(agentId)
    if (!agent || agent.role !== 'agent') {
      throw new Error('Agent not found')
    }

    // Check if already following
    const existingFollow = await agentFollowModel.findOne({
      follower: followerId,
      agent: agentId,
      _destroy: false
    })

    if (existingFollow) {
      throw new Error('Already following this agent')
    }

    // Check if there's a soft-deleted follow to restore
    const deletedFollow = await agentFollowModel.findOne({
      follower: followerId,
      agent: agentId,
      _destroy: true
    })

    let follow
    if (deletedFollow) {
      deletedFollow._destroy = false
      deletedFollow.createdAt = new Date()
      await deletedFollow.save()
      follow = deletedFollow
    } else {
      follow = await agentFollowModel.create({
        follower: followerId,
        agent: agentId
      })
    }

    await follow.populate('follower', 'fullName userName avatar')

    // Send notification to agent
    const follower = await userModel.findById(followerId).select('fullName userName')
    await createAndEmitNotification(agentId, {
      type: 'PROPERTY',
      title: 'New Follower',
      message: `${follower.fullName || follower.userName} started following you`,
      meta: {
        followerId: followerId,
        agentId: agentId
      }
    })

    return {
      success: true,
      message: 'Successfully followed agent',
      follow
    }
  } catch (error) {
    throw error
  }
}

// Unfollow an agent
const unfollowAgent = async (followerId, agentId) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID')
    }

    const follow = await agentFollowModel.findOne({
      follower: followerId,
      agent: agentId,
      _destroy: false
    })

    if (!follow) {
      throw new Error('Not following this agent')
    }

    // Soft delete
    follow._destroy = true
    await follow.save()

    return {
      success: true,
      message: 'Successfully unfollowed agent'
    }
  } catch (error) {
    throw error
  }
}

// Check if user is following an agent
const isFollowing = async (userId, agentId) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      return { isFollowing: false }
    }

    const follow = await agentFollowModel.findOne({
      follower: userId,
      agent: agentId,
      _destroy: false
    })

    return {
      isFollowing: !!follow
    }
  } catch (error) {
    throw error
  }
}

// Get follow statistics for an agent
const getAgentFollowStats = async (agentId) => {
  try {
    if (!Types.ObjectId.isValid(agentId)) {
      throw new Error('Invalid agent ID')
    }

    const totalFollowers = await agentFollowModel.countDocuments({
      agent: agentId,
      _destroy: false
    })

    return {
      success: true,
      totalFollowers
    }
  } catch (error) {
    throw error
  }
}

// Toggle follow (follow if not following, unfollow if following)
const toggleFollow = async (followerId, agentId) => {
  try {
    const isFollowingResult = await isFollowing(followerId, agentId)
    
    if (isFollowingResult.isFollowing) {
      const result = await unfollowAgent(followerId, agentId)
      return { ...result, action: 'removed' }
    } else {
      const result = await followAgent(followerId, agentId)
      return { ...result, action: 'added' }
    }
  } catch (error) {
    throw error
  }
}

export const agentFollowService = {
  getAgentFollowers,
  getUserFollowing,
  followAgent,
  unfollowAgent,
  isFollowing,
  getAgentFollowStats,
  toggleFollow
}

