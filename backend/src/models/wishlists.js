import mongoose from "mongoose"

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    properties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    }]
}, { timestamps: true })

const wishlistModel = mongoose.model('Wishlist', wishlistSchema)

export default wishlistModel