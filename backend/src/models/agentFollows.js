import mongoose from "mongoose"

const agentFollowSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    _destroy: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// Index for efficient queries
agentFollowSchema.index({ agent: 1, _destroy: 1 })
agentFollowSchema.index({ follower: 1, agent: 1 })
agentFollowSchema.index({ createdAt: -1 })

// Prevent duplicate follows from same user to same agent
agentFollowSchema.index({ follower: 1, agent: 1 }, { unique: true })

const agentFollowModel = mongoose.model('AgentFollow', agentFollowSchema)
export default agentFollowModel

