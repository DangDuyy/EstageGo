import { StatusCodes } from 'http-status-codes'
import { agentFollowService } from '~/services/agentFollowService'

// Get all followers for an agent
const getAgentFollowers = async (req, res, next) => {
  try {
    const { agentId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const result = await agentFollowService.getAgentFollowers(agentId, page, limit)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Get all agents a user is following
const getUserFollowing = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const result = await agentFollowService.getUserFollowing(userId, page, limit)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Get all agents an agent is following
const getAgentFollowing = async (req, res, next) => {
  try {
    const { agentId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    console.log(`[FollowController] Getting following for agent: ${agentId}, page: ${page}, limit: ${limit}`)
    const result = await agentFollowService.getAgentFollowing(agentId, page, limit)
    console.log(`[FollowController] Following result:`, result)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    console.error(`[FollowController] Error getting following:`, error)
    next(error)
  }
}

// Follow an agent
const followAgent = async (req, res, next) => {
  try {
    const followerId = req.jwtDecoded._id
    const { agentId } = req.params

    const result = await agentFollowService.followAgent(followerId, agentId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message === 'Cannot follow yourself' || 
        error.message === 'Agent not found' ||
        error.message === 'Already following this agent') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

// Unfollow an agent
const unfollowAgent = async (req, res, next) => {
  try {
    const followerId = req.jwtDecoded._id
    const { agentId } = req.params

    const result = await agentFollowService.unfollowAgent(followerId, agentId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message === 'Not following this agent') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

// Check if user is following an agent
const isFollowing = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { agentId } = req.params

    const result = await agentFollowService.isFollowing(userId, agentId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Get follow statistics for an agent
const getAgentFollowStats = async (req, res, next) => {
  try {
    const { agentId } = req.params

    const result = await agentFollowService.getAgentFollowStats(agentId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Toggle follow (follow if not following, unfollow if following)
const toggleFollow = async (req, res, next) => {
  try {
    const followerId = req.jwtDecoded._id
    const { agentId } = req.params

    const result = await agentFollowService.toggleFollow(followerId, agentId)
    
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    if (error.message === 'Cannot follow yourself' || 
        error.message === 'Agent not found') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message
      })
    }
    next(error)
  }
}

export const agentFollowController = {
  getAgentFollowers,
  getUserFollowing,
  getAgentFollowing,
  followAgent,
  unfollowAgent,
  isFollowing,
  getAgentFollowStats,
  toggleFollow
}

