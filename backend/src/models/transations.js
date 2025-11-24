import mongoose from "mongoose"

const TRANSACTION_TYPE = {
    DEPOSIT: 'deposit', // Nạp tiền
    FEE: 'fee',         // Trừ phí (đăng tin VIP, quảng cáo)
    REFUND: 'refund',   // Hoàn tiền
    WITHDRAW: 'withdraw'// Rút tiền
}

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(TRANSACTION_TYPE),
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    description: {
        type: String
    },
    referenceId: { // Liên kết với ID giao dịch của bên thứ 3 (VD: ngân hàng, cổng thanh toán)
        type: String,
        default: null
    }
}, { timestamps: true })

const transactionModel = mongoose.model('Transaction', transactionSchema)
export default transactionModel