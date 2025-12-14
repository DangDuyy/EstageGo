import mongoose from "mongoose"

const agentReviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: null,
        maxlength: 2000
    },
    media: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['image', 'video'],
            required: true
        }
    }],
    _destroy: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// Index for efficient queries
agentReviewSchema.index({ agent: 1, _destroy: 1 })
agentReviewSchema.index({ reviewer: 1, agent: 1 })
agentReviewSchema.index({ createdAt: -1 })

// Prevent duplicate reviews from same user to same agent
agentReviewSchema.index({ reviewer: 1, agent: 1 }, { unique: true })

const agentReviewModel = mongoose.model('AgentReview', agentReviewSchema)
export default agentReviewModel

