import mongoose from "mongoose";

const agentRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Thông tin đăng ký agent
    companyName: {
        type: String,
        trim: true,
        maxlength: 200
    },
    agentTitle: {
        type: String,
        trim: true,
        maxlength: 200
    },
    bio: {
        type: String,
        maxlength: 2000
    },
    specializations: [{
        type: String,
        trim: true
    }],
    areasServed: [{
        type: String,
        trim: true
    }],
    experience: {
        type: Number,
        min: 0
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    website: {
        type: String
    },
    socialLinks: {
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null }
    },
    // Admin notes và hành động
    adminNotes: {
        type: String,
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index để tìm kiếm nhanh
agentRequestSchema.index({ userId: 1, status: 1 });
agentRequestSchema.index({ status: 1, createdAt: -1 });

const agentRequestModel = mongoose.model('AgentRequest', agentRequestSchema);
export default agentRequestModel;
