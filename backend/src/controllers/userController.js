import { StatusCodes } from "http-status-codes"
import { userService } from "~/services/userService"
import ApiError from "~/utils/ApiError"
import ms from "ms"
import { env } from "~/config/environment"
import TwilioProvider from "~/providers/TwilioProvider"

// Register - hỗ trợ email và phone
const createNew = async (req, res, next) => {
  try {
    const result = await userService.createNew(req.body)
    
    // Nếu phone registration, gửi OTP ngay
    if (result.contactType === 'phone' && result.phone) {
      try {
        await TwilioProvider.sendVerificationCode(result.phone)
        result.message = 'Registration successful! Verification code sent to your phone.'
        console.log('✅ OTP sent to phone:', result.phone)
      } catch (twilioError) {
        console.error('❌ Twilio send error:', twilioError)
        result.message = 'Registration successful! But failed to send verification code. Please try again.'
      }
    }
    
    return res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    console.error('❌ Register error:', error)
    next(error)
  }
}

// ✅ Verify email token
const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    
    console.log('✅ Email verified for user:', req.body.email)
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      user: result
    })
  } catch (error) {
    console.error('❌ Email verify error:', error)
    next(error)
  }
}

// ✅ Verify phone OTP (sau khi đăng ký)
const verifyPhoneRegistration = async (req, res, next) => {
  try {
    const { phone, code } = req.body

    if (!phone || !code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Phone and verification code are required'
      })
    }

    // Verify với Twilio
    const check = await TwilioProvider.checkVerificationCode(phone, code)

    if (check.status !== 'approved') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired verification code'
      })
    }

    // Active account
    const result = await userService.verifyPhoneRegistration(phone, code)

    console.log('✅ Phone verified for user:', phone)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Phone verified successfully! You can now login.',
      user: result
    })
  } catch (error) {
    console.error('❌ Phone verify error:', error)
    next(error)
  }
}

// ✅ Login - hỗ trợ email/password và phone/password (giống nhau)
const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    // Set cookies
    const isProd = env.BUILD_MODE === 'production'
    const accessTokenLife = env.ACCESS_TOKEN_LIFE || '1h'
    const refreshTokenLife = env.REFRESH_TOKEN_LIFE || '14 days'

    const commonCookie = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    }

    res.cookie('accessToken', result.accessToken, {
      ...commonCookie,
      maxAge: ms(accessTokenLife)
    })

    res.cookie('refreshToken', result.refreshToken, {
      ...commonCookie,
      maxAge: ms(refreshTokenLife)
    })

    console.log('✅ Login successful')

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    console.error('❌ Login error:', error.message)
    next(error)
  }
}

// ✅ Logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    
    res.status(StatusCodes.OK).json({ message: 'Logout successfully!' })
  } catch (error) {
    next(error)
  }
}

// ✅ Refresh token
const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token not found')
    }

    const result = await userService.refreshToken(refreshToken)

    const isProd = env.BUILD_MODE === 'production'
    const accessTokenLife = env.ACCESS_TOKEN_LIFE || '1h'

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: ms(accessTokenLife)
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// ✅ Update profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await userService.updateProfile(userId, req.body)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully',
      user: result
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Change password
const changePassword = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Old password and new password are required'
      })
    }

    const result = await userService.changePassword(userId, oldPassword, newPassword)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// ✅ Request agent role
const requestAgentRole = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await userService.requestAgentRole(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Agent role request submitted successfully',
      user: result
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Remove agent role
const removeAgentRole = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await userService.removeAgentRole(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Agent role removed successfully',
      user: result
    })
  } catch (error) {
    next(error)
  }
}

// ✅ Get all agents
const getAllAgents = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 12 } = req.query
    const result = await userService.getAllAgents(search, parseInt(page), parseInt(limit))

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// ✅ Get agent by ID
const getAgentById = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await userService.getAgentById(id)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// ✅ Get user profile by ID
const getUserProfileById = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await userService.getUserProfileById(id)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// ✅ Send phone verification (for profile update)
const sendPhoneVerification = async (req, res, next) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Phone number is required'
      })
    }

    await TwilioProvider.sendVerificationCode(phone)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Verification code sent to your phone'
    })
  } catch (error) {
    console.error('❌ Send phone verification error:', error)
    next(error)
  }
}

// ✅ Verify phone code (for profile update)
const verifyPhoneCode = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { phone, code } = req.body

    if (!phone || !code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Phone and code are required'
      })
    }

    const check = await TwilioProvider.checkVerificationCode(phone, code)

    if (check.status !== 'approved') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid verification code'
      })
    }

    const result = await userService.updatePhone(userId, phone)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Phone verified and updated successfully',
      user: result
    })
  } catch (error) {
    console.error('❌ Verify phone code error:', error)
    next(error)
  }
}

export const userController = {
  createNew,
  verifyAccount,
  verifyPhoneRegistration,
  login,
  logout,
  refreshToken,
  updateProfile,
  changePassword,
  requestAgentRole,
  removeAgentRole,
  getAllAgents,
  getAgentById,
  getUserProfileById,
  sendPhoneVerification,
  verifyPhoneCode
}