import { VNPay, ignoreLogger } from 'vnpay'
import moment from 'moment'
import { env } from '~/config/environment'

const vnpay = new VNPay({
  tmnCode: '1RLNZPR4',          
  secureSecret: 'LT32542YMYS3OM0SR2Y8ZOLRDH394W80',   
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  vnpReturnUrl: env.VNPAY_RETURN_URL
})

/**
 * Create payment URL
 */
const createPaymentUrl = ({ orderId, amount, orderInfo, ipAddr, bankCode }) => {
  try {
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_Command: 'pay',
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: env.VNPAY_RETURN_URL,
      vnp_TxnRef: orderId,
      vnp_BankCode: bankCode || undefined
    })

    return paymentUrl
  } catch (error) {
    console.error('❌ VNPay: Create payment URL error:', error.message)
    throw error
  }
}

/**
 * Verify return URL from VNPay
 */
const verifyReturnUrl = (vnpParams) => {
  try {

    // Verify secure hash
    const verify = vnpay.verifyReturnUrl(vnpParams)

    if (!verify.isVerified) {
      console.log('❌ VNPay: Invalid signature')
      return {
        isValid: false,
        isSuccess: false,
        message: 'Invalid signature',
        data: null
      }
    }

    // Check if payment is successful
    const isSuccess = verify.isSuccess

    if (isSuccess) {
      console.log('✅ VNPay: Payment successful')
      return {
        isValid: true,
        isSuccess: true,
        message: 'Payment successful',
        data: {
          orderId: vnpParams.vnp_TxnRef,
          amount: parseInt(vnpParams.vnp_Amount) / 100,
          transactionNo: vnpParams.vnp_TransactionNo,
          bankCode: vnpParams.vnp_BankCode,
          bankTranNo: vnpParams.vnp_BankTranNo,
          cardType: vnpParams.vnp_CardType,
          payDate: vnpParams.vnp_PayDate,
          responseCode: vnpParams.vnp_ResponseCode
        }
      }
    } else {
      const message = getResponseMessage(vnpParams.vnp_ResponseCode)
      console.log('❌ VNPay: Payment failed -', message)
      return {
        isValid: true,
        isSuccess: false,
        message,
        data: {
          orderId: vnpParams.vnp_TxnRef,
          responseCode: vnpParams.vnp_ResponseCode
        }
      }
    }
  } catch (error) {
    console.error('❌ VNPay: Verify return URL error:', error.message)
    return {
      isValid: false,
      isSuccess: false,
      message: error.message,
      data: null
    }
  }
}

/**
 * Get Vietnamese response message from VNPay response code
 */
const getResponseMessage = (code) => {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
    '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
  }
  return messages[code] || 'Lỗi không xác định'
}

export default {
  createPaymentUrl,
  verifyReturnUrl,
  getResponseMessage
}