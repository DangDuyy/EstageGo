import express from 'express'
import { agentFollowController } from '~/controllers/agentFollowController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

// Public routes (no auth required)
// GET /api/v1/agent-follows/followers/:agentId - Get all followers for an agent
Router.get('/followers/:agentId', agentFollowController.getAgentFollowers)

// GET /api/v1/agent-follows/stats/:agentId - Get follow statistics for an agent
Router.get('/stats/:agentId', agentFollowController.getAgentFollowStats)

// GET /api/v1/agent-follows/following-list/:agentId - Get all agents an agent is following
Router.get('/following-list/:agentId', agentFollowController.getAgentFollowing)

// Protected routes (auth required)
Router.use(authMiddleware.isAuthorized)

// GET /api/v1/agent-follows/following - Get all agents user is following
Router.get('/following', agentFollowController.getUserFollowing)

// GET /api/v1/agent-follows/check/:agentId - Check if user is following an agent
Router.get('/check/:agentId', agentFollowController.isFollowing)

// POST /api/v1/agent-follows/:agentId - Follow an agent
Router.post('/:agentId', agentFollowController.followAgent)

// DELETE /api/v1/agent-follows/:agentId - Unfollow an agent
Router.delete('/:agentId', agentFollowController.unfollowAgent)

// POST /api/v1/agent-follows/toggle/:agentId - Toggle follow (follow/unfollow)
Router.post('/toggle/:agentId', agentFollowController.toggleFollow)

export const agentFollowRoute = Router

