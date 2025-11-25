import VNPayProvider from '~/providers/VNPayProvider'
import transactionModel from '~/models/transations'
import userModel from '~/models/users'
import { v4 as uuidv4 } from 'uuid'

const createPayment = async ({ userId, amount, bankCode, ipAddr }) => {
  try {
    // Validate amount
    if (!amount || amount < 10000) {
      throw new Error('Minimum deposit amount is 10,000 VND')
    }

    if (amount > 500000000) {
      throw new Error('Maximum deposit amount is 500,000,000 VND')
    }

    // Generate unique order ID
    const orderId = `DEP${Date.now()}${uuidv4().split('-')[0].toUpperCase()}`

    // Get user info for order description
    const user = await userModel.findById(userId).select('userName fullName')

    if (!user) {
      throw new Error('User not found')
    }

    // Create transaction record
    const transaction = await transactionModel.create({
      user: userId,
      orderId,
      type: 'deposit',
      amount,
      status: 'pending',
      paymentMethod: 'vnpay',
      description: `Deposit to account ${user.userName}`,
      bankCode: bankCode || null
    })

    // Create VNPay payment URL
    const paymentUrl = VNPayProvider.createPaymentUrl({
      orderId,
      amount,
      orderInfo: `EstageGo deposit - ${user.fullName || user.userName}`,
      ipAddr,
      bankCode
    })

    return {
      orderId,
      paymentUrl,
      transactionId: transaction._id
    }
  } catch (error) {
    console.error('❌ Create payment error:', error)
    throw error
  }
}

const handleVNPayReturn = async (vnpParams) => {
  try {
    // Verify signature and payment status
    const verifyResult = VNPayProvider.verifyReturnUrl(vnpParams)

    if (!verifyResult.isValid) {
      throw new Error(verifyResult.message)
    }

    const orderId = vnpParams.vnp_TxnRef

    // Find transaction
    const transaction = await transactionModel.findOne({ orderId })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Check if already processed
    if (transaction.status !== 'pending') {
      console.log('⚠️  Transaction already processed:', orderId)
      return {
        success: transaction.status === 'completed',
        message: 'Transaction already processed',
        orderId,
        amount: transaction.amount
      }
    }

    // Update transaction with VNPay response data
    transaction.transactionNo = vnpParams.vnp_TransactionNo
    transaction.bankCode = vnpParams.vnp_BankCode
    transaction.bankTranNo = vnpParams.vnp_BankTranNo
    transaction.cardType = vnpParams.vnp_CardType
    transaction.payDate = vnpParams.vnp_PayDate
    transaction.responseCode = vnpParams.vnp_ResponseCode
    transaction.referenceId = vnpParams.vnp_TransactionNo

    if (verifyResult.isSuccess) {
      // Payment successful - update transaction and user balance
      transaction.status = 'completed'

      await userModel.findByIdAndUpdate(
        transaction.user,
        { $inc: { balance: transaction.amount } }
      )

      console.log('✅ Payment successful')
      console.log('  - Order ID:', orderId)
      console.log('  - Amount:', transaction.amount.toLocaleString('vi-VN'), 'VND')
      console.log('  - Transaction No:', transaction.transactionNo)
    } else {
      // Payment failed
      transaction.status = 'failed'
      console.log('❌ Payment failed')
      console.log('  - Order ID:', orderId)
      console.log('  - Reason:', verifyResult.message)
    }

    await transaction.save()

    return {
      success: transaction.status === 'completed',
      message: verifyResult.message,
      orderId,
      amount: transaction.amount
    }
  } catch (error) {
    console.error('❌ Handle VNPay return error:', error)
    throw error
  }
}

const getTransactionHistory = async ({ userId, page, limit, status, type }) => {
  try {
    const query = { user: userId }

    if (status) query.status = status
    if (type) query.type = type

    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      transactionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      transactionModel.countDocuments(query)
    ])

    return {
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('❌ Get transaction history error:', error)
    throw error
  }
}

const getBalance = async (userId) => {
  try {
    console.log('🔍 Getting balance for userId:', userId)
    
    const user = await userModel.findById(userId).select('balance userName')
    
    if (!user) {
      console.log('❌ User not found with ID:', userId)
      throw new Error('User not found')
    }
    
    console.log('✅ User found:', user.userName, '- Balance:', user.balance)
    return user.balance || 0
  } catch (error) {
    console.error('❌ Get balance error:', error)
    throw error
  }
}

const getTransactionDetail = async ({ userId, transactionId }) => {
  try {
    const transaction = await transactionModel
      .findOne({
        _id: transactionId,
        user: userId
      })
      .populate('user', 'userName email fullName')
      .lean()

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    return {
      success: true,
      data: transaction
    }
  } catch (error) {
    console.error('❌ Get transaction detail error:', error)
    throw error
  }
}

// Deduct balance for fees (VIP posts, ads, etc.)
const deductBalance = async ({ userId, amount, description, referenceId }) => {
  try {
    const user = await userModel.findById(userId).select('balance userName')

    if (!user) {
      throw new Error('User not found')
    }

    if (user.balance < amount) {
      throw new Error('Insufficient balance')
    }

    // Generate unique order ID for fee transaction
    const orderId = `FEE${Date.now()}${uuidv4().split('-')[0].toUpperCase()}`

    // Create fee transaction
    const transaction = await transactionModel.create({
      user: userId,
      orderId,
      type: 'fee',
      amount,
      status: 'completed',
      paymentMethod: 'vnpay',
      description: description || 'Fee deduction',
      referenceId
    })

    // Deduct balance from user
    await userModel.findByIdAndUpdate(
      userId,
      { $inc: { balance: -amount } }
    )

    console.log('💸 Balance deducted')
    console.log('  - User:', user.userName)
    console.log('  - Amount:', amount.toLocaleString('vi-VN'), 'VND')
    console.log('  - New balance:', (user.balance - amount).toLocaleString('vi-VN'), 'VND')

    return {
      success: true,
      transaction,
      newBalance: user.balance - amount
    }
  } catch (error) {
    console.error('❌ Deduct balance error:', error)
    throw error
  }
}

export default {
  createPayment,
  handleVNPayReturn,
  getTransactionHistory,
  getBalance,
  getTransactionDetail,
  deductBalance
}