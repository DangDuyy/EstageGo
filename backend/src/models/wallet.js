import mongoose from "mongoose"

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi User chỉ có 1 Wallet
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0 // Số dư không thể âm
    },
    currency: {
        type: String,
        enum: ['VND', 'USD', 'EUR'], // Tương tự currency của Property
        default: 'VND'
    },
    // Khóa lạc quan (Optional - Tốt cho giao dịch)
    lockVersion: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const walletModel = mongoose.model('Wallet', walletSchema)
export default walletModel