import express from 'express'
import { agentReviewController } from '~/controllers/agentReviewController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles } from '~/middlewares/uploadMiddleware'

const Router = express.Router()

// Public routes (no auth required)
// GET /api/v1/agent-reviews - Get all recent reviews for homepage
Router.get('/', agentReviewController.getAllRecentReviews)

// GET /api/v1/agent-reviews/:agentId - Get all reviews for an agent
Router.get('/agent/:agentId', agentReviewController.getAgentReviews)

// GET /api/v1/agent-reviews/review/:reviewId - Get single review by ID
Router.get('/review/:reviewId', agentReviewController.getReviewById)

// Protected routes (auth required)
Router.use(authMiddleware.isAuthorized)

// POST /api/v1/agent-reviews/upload-images - Upload review images
Router.post('/upload-images', uploadFiles, agentReviewController.uploadReviewImages)

// GET /api/v1/agent-reviews/user/:agentId - Get user's review for an agent
Router.get('/user/:agentId', agentReviewController.getUserReviewForAgent)

// POST /api/v1/agent-reviews/:agentId - Create a review
Router.post('/:agentId', agentReviewController.createReview)

// PUT /api/v1/agent-reviews/:reviewId - Update a review
Router.put('/:reviewId', agentReviewController.updateReview)

// DELETE /api/v1/agent-reviews/:reviewId - Delete a review
Router.delete('/:reviewId', agentReviewController.deleteReview)

export const agentReviewRoute = Router

