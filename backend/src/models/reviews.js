import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
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
        default: null
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

const reviewModel = mongoose.model('Review', reviewSchema)
export default reviewModel