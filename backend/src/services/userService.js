import { randomBytes, createHash } from 'crypto'
import bcryptjs from 'bcryptjs'
import { StatusCodes } from "http-status-codes"
import ApiError from "~/utils/ApiError"
import { sendVerificationEmail } from '~/utils/mail'
import userModel from "~/models/users"
import { pickUser } from "~/utils/formatter"
import { JwtProvider } from "~/providers/JwtProvider"
import { env } from "~/config/environment"

/**
 * Đăng ký user mới - gửi email xác thực
 * payload: { email, userName, password }
 */
const createNew = async (reqBody) => {
  try {
    const { email, userName, password } = reqBody
    if (!email || !userName || !password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email, username and password are required')
    }

    // Check email đã tồn tại
    const existEmail = await userModel.findOne({ email })
    if (existEmail) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
    }

    // Check username đã tồn tại
    const existUsername = await userModel.findOne({ userName })
    if (existUsername) {
      throw new ApiError(StatusCodes.CONFLICT, 'Username already exists')
    }

    // Hash password
    const hashedPassword = bcryptjs.hashSync(password, 10)

    // Tạo verify token
    const verifyToken = randomBytes(32).toString('hex')

    // Tạo user mới
    const newUser = await userModel.create({
      email,
      userName,
      password: hashedPassword,
      isActive: false,
      verifyToken
    })

    // Link verify đến trang verify-account
    const verifyLink = `${env.WEBSITE_DOMAIN_DEVELOPMENT}/verify-account?token=${verifyToken}&email=${encodeURIComponent(email)}`
    
    console.log('🔗 Verify link:', verifyLink)
    
    await sendVerificationEmail({ 
      to: email, 
      verifyLink,
      userName 
    })

    return { 
      ok: true, 
      message: 'Registration successful! Please check your email to verify your account.'
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Failed to create new user')
  }
}

/**
 * Xác thực account qua email link
 * payload: { email, token }
 */
const verifyAccount = async (reqBody) => {
  try {
    const { email, token } = reqBody
    
    const existUser = await userModel.findOne({ email })

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is already active')
    if (token !== existUser.verifyToken) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid')

    const updateData = {
      isActive: true,
      verifyToken: null
    }

    const updateUser = await userModel.findByIdAndUpdate(existUser._id, { $set: updateData }, { new: true })
    return pickUser(updateUser)
  } catch (error) {
    throw new Error
  }
}

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOne({email: reqBody.email})

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is not active. Please verify your email.')

    if (!bcryptjs.compareSync(reqBody.password, existUser.password))
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your email or password is incorrect')

    const userInfo = {
      _id: existUser._id,
      email: existUser.email
    }

    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    )

    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    )

    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) {
    throw new Error(error)
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }

    const accessToken = await JwtProvider.generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE, env.ACCESS_TOKEN_LIFE)

    return { accessToken }
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is invalid')
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken
}