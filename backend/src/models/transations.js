import mongoose from "mongoose"

const TRANSACTION_TYPE = {
    DEPOSIT: 'deposit', // Nạp tiền
    FEE: 'fee',         // Trừ phí (đăng tin VIP, quảng cáo)
    REFUND: 'refund',   // Hoàn tiền
    WITHDRAW: 'withdraw'// Rút tiền
}

const PAYMENT_METHOD = {
    VNPAY: 'vnpay',
    MOMO: 'momo',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
    WALLET: 'wallet'
}

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
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
        default: 'pending',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PAYMENT_METHOD),
        default: PAYMENT_METHOD.VNPAY
    },
    description: {
        type: String
    },
    referenceId: { // Liên kết với ID giao dịch của bên thứ 3 (VD: ngân hàng, cổng thanh toán)
        type: String,
        default: null
    },
    // VNPay specific fields
    transactionNo: {
        type: String,
        default: null
    },
    bankCode: {
        type: String,
        default: null
    },
    bankTranNo: {
        type: String,
        default: null
    },
    cardType: {
        type: String,
        default: null
    },
    payDate: {
        type: String,
        default: null
    },
    responseCode: {
        type: String,
        default: null
    }
}, { timestamps: true })

// Indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 })
transactionSchema.index({ status: 1, createdAt: -1 })
transactionSchema.index({ type: 1, status: 1 })

const transactionModel = mongoose.model('Transaction', transactionSchema)
export default transactionModel