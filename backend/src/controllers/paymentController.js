import { StatusCodes } from 'http-status-codes'
import paymentService from '~/services/paymentService'
import { env } from '~/config/environment'

const createPayment = async (req, res, next) => {
  try {
    const { amount, bankCode } = req.body
    const userId = req.jwtDecoded._id
    
    // Get client IP
    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   '127.0.0.1'

    const result = await paymentService.createPayment({
      userId,
      amount: parseInt(amount),
      bankCode,
      ipAddr
    })

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Payment URL created successfully',
      paymentUrl: result.paymentUrl,
      orderId: result.orderId,
      transactionId: result.transactionId
    })
  } catch (error) {
    console.error('❌ Create payment error:', error)
    next(error)
  }
}

const vnpayReturn = async (req, res, next) => {
  try {
    const vnpParams = req.query

    const result = await paymentService.handleVNPayReturn(vnpParams)

    // Redirect to frontend with result
    const frontendUrl = env.FRONTEND_URL
    const redirectUrl = `${frontendUrl}/payment/result?success=${result.success}&message=${encodeURIComponent(result.message)}&orderId=${result.orderId || ''}&amount=${result.amount || 0}`

    return res.redirect(redirectUrl)
  } catch (error) {
    console.error('❌ VNPay return error:', error)
    const frontendUrl = env.FRONTEND_URL
    return res.redirect(`${frontendUrl}/payment/result?success=false&message=${encodeURIComponent(error.message)}`)
  }
}

const getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { page = 1, limit = 10, status, type, startDate, endDate, transactionType } = req.query

    const result = await paymentService.getTransactionHistory({
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      startDate,
      endDate,
      transactionType
    })

    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    console.error('❌ Get transaction history error:', error)
    next(error)
  }
}

const getBalance = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id    
    const balance = await paymentService.getBalance(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      balance
    })
  } catch (error) {
    console.error('❌ Get balance error:', error)
    next(error)
  }
}

const getTransactionDetail = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { transactionId } = req.params

    const result = await paymentService.getTransactionDetail({
      userId,
      transactionId
    })

    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    console.error('❌ Get transaction detail error:', error)
    next(error)
  }
}

/**
 * Get bank list supported by VNPay
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const getBankList = async (req, res, next) => {
  try {
    const bankList = await paymentService.getBankList()
    return res.status(StatusCodes.OK).json({
      success: true,
      data: bankList
    })
  } catch (error) {
    console.error('❌ Get bank list error:', error)
    next(error)
  }
}

export const paymentController = {
  createPayment,
  vnpayReturn,
  getTransactionHistory,
  getBalance,
  getTransactionDetail,
  getBankList
}