import { randomBytes } from 'crypto'
import bcryptjs from 'bcryptjs'
import { StatusCodes } from "http-status-codes"
import ApiError from "~/utils/ApiError"
import { sendVerificationEmail } from '~/utils/mail'
import userModel from "~/models/users"
import { pickUser } from "~/utils/formatter"
import { JwtProvider } from "~/providers/JwtProvider"
import { env } from "~/config/environment"
import { OAuth2Client } from 'google-auth-library'
import propertyModel from '~/models/properties'
import agentFollowModel from '~/models/agentFollows'
import agentReviewModel from '~/models/agentReviews'
import mongoose from 'mongoose'

/**
 * Generate random fullName
 */
const generateFullName = () => {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000)
  return `User_${randomNum}`
}

/**
 * Đăng ký user mới - hỗ trợ email hoặc phone
 * payload: { email?, phone?, userName, password, contactType }
 */
const createNew = async (reqBody) => {
  try {
    const { email, phone, userName, password, contactType } = reqBody
    
    const usePhone = contactType === 'phone' || (!contactType && phone && !email)
    console.log('🆕 Register request:', { contactType, usePhone, email, phone, userName })
    
    if (!userName || !password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Username and password are required')
    }

    if (!email && !phone) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email or phone is required')
    }

    // Check email đã tồn tại
    if (email) {
      const existEmail = await userModel.findOne({ email })
      if (existEmail) {
        throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
      }
    }

    // Check phone đã tồn tại
    if (phone) {
      const existPhone = await userModel.findOne({ phone })
      if (existPhone) {
        throw new ApiError(StatusCodes.CONFLICT, 'Phone number already exists')
      }
    }

    // Check username đã tồn tại
    const existUsername = await userModel.findOne({ userName })
    if (existUsername) {
      throw new ApiError(StatusCodes.CONFLICT, 'Username already exists')
    }

    // Hash password
    const hashedPassword = bcryptjs.hashSync(password, 10)
    const fullName = generateFullName()
    console.log('✅ Generated fullName:', fullName)

    // Tạo user data
    const userData = {
      userName,
      fullName, // Random fullName
      password: hashedPassword,
      isActive: false
    }

    // Email flow
    if (!usePhone && email) {
      const verifyToken = randomBytes(32).toString('hex')
      const tokenExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      
      userData.email = email
      userData.verifyToken = verifyToken
      userData.verifyTokenExpires = tokenExpires

      const newUser = await userModel.create(userData)

      const verifyLink = `${env.WEBSITE_DOMAIN_DEVELOPMENT}/verify-account?token=${verifyToken}&email=${encodeURIComponent(email)}`
      
      await sendVerificationEmail({ 
        to: email, 
        verifyLink,
        userName: fullName // Dùng fullName trong email
      })

      console.log('✅ Verification email sent to:', email)

      return { 
        ok: true, 
        message: 'Registration successful! Please check your email to verify your account.',
        contactType: 'email',
        userId: newUser._id
      }
    }

    // Phone flow
    if (usePhone && phone) {
      userData.phone = phone
      
      const newUser = await userModel.create(userData)

      console.log('✅ User created with phone:', phone)

      return {
        ok: true,
        message: 'Registration successful! Please verify your phone number.',
        contactType: 'phone',
        userId: newUser._id,
        phone
      }
    }

    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid registration data')

  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Failed to create new user')
  }
}

/**
 * Xác thực account qua email link
 */
const verifyAccount = async (reqBody) => {
  try {
    const { email, token } = reqBody
    
    const existUser = await userModel.findOne({ email })

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is already active')
    if (token !== existUser.verifyToken) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid')

    if (existUser.verifyTokenExpires && existUser.verifyTokenExpires < Date.now()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification token expired')
    }

    const updateData = {
      isActive: true,
      isEmailVerified: true,
      verifyToken: null,
      verifyTokenExpires: null
    }

    const updateUser = await userModel.findByIdAndUpdate(existUser._id, { $set: updateData }, { new: true })
    return pickUser(updateUser)
  } catch (error) {
    throw error
  }
}

/**
 * ✅ Verify phone OTP và active account (sau khi đăng ký)
 */
const verifyPhoneRegistration = async (phone, code) => {
  try {
    const user = await userModel.findOne({ phone })
    
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (user.isActive) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Account is already active')
    }

    user.isActive = true
    user.isPhoneVerified = true
    await user.save()

    console.log('✅ Phone verified and account activated:', phone)

    return pickUser(user)
  } catch (error) {
    throw error
  }
}

/**
 * Login - email/password hoặc phone/password
 */
const login = async (reqBody) => {
  try {
    const { email, phone, password, contactType } = reqBody
    
    const usePhone = contactType === 'phone' || (!contactType && phone && !email)
    
    console.log('🔐 Login request:', { contactType, usePhone, email, phone })

    if (!password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is required')
    }

    let existUser

    // ✅ Phone login
    if (usePhone) {
      if (!phone) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Phone number is required')
      }

      existUser = await userModel.findOne({ phone })
      
      if (!existUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
      }
    } 
    // ✅ Email login
    else {
      if (!email) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Email is required')
      }

      existUser = await userModel.findOne({ email })
      
      if (!existUser) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
      }
    }

    // Check account active
    if (!existUser.isActive) {
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE, 
        `Account is not active. Please verify your ${usePhone ? 'phone number' : 'email'}.`
      )
    }

    // Verify password
    if (!bcryptjs.compareSync(password, existUser.password)) {
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE, 
        `Your ${usePhone ? 'phone number' : 'email'} or password is incorrect`
      )
    }

    // Generate tokens
    const userInfo = {
      _id: existUser._id,
      email: existUser.email,
      phone: existUser.phone
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

    console.log('✅ Login successful:', usePhone ? phone : email)

    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) {
    throw error
  }
}

const loginWithGoogle = async (googleToken) => {
  try {
    // Verify Google token and get user info (you can use Google API for this)
    // For simplicity, let's assume we have verified and got email from Google token
    const googleUserInfo = await verifyGoogleToken(googleToken) // Implement this function

    let existUser = await userModel.findOne({ email: googleUserInfo.email })

    // If user doesn't exist, create a new one
    if (!existUser) {
      const newUser = new userModel({
        email: googleUserInfo.email,
        fullName: googleUserInfo.fullName,
        avatar: googleUserInfo.avatar,
        isActive: true,
        isEmailVerified: true,
        userName: googleUserInfo.email.split('@')[0]
      })
      existUser = await newUser.save()
    }
    // Generate tokens
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
    throw error
  }
}

const verifyGoogleToken = async (token) => {
  // Implement Google token verification logic here
  // You can use Google's OAuth2 client library to verify the token
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: env.GOOGLE_CLIENT_ID
  })
  const payload = ticket.getPayload()
  console.log('✅ Google token verified:', payload)
  return {
    email: payload.email,
    fullName: payload.name,
    avatar: payload.picture
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

const updateProfile = async (userId, updateData) => {
  try {
    // Remove fields that should not be updated
    const { password, email, phone, userName, role, isActive, verifyToken, ...allowedUpdates } = updateData

    // Build $set object with dot-notation for nested brokerPage to avoid replacing the whole subdocument
    const setData = {}

    // Copy top-level allowed fields except brokerPage (handled below)
    Object.keys(allowedUpdates).forEach((key) => {
      if (key !== 'brokerPage') {
        setData[key] = allowedUpdates[key]
      }
    })

    // Handle brokerPage partial updates safely
    if (allowedUpdates.brokerPage && typeof allowedUpdates.brokerPage === 'object') {
      const bp = allowedUpdates.brokerPage
      // Only set provided brokerPage fields; do NOT overwrite the entire object
      if (bp.agentTitle !== undefined) setData['brokerPage.agentTitle'] = bp.agentTitle
      if (bp.yearsOfExperience !== undefined) setData['brokerPage.yearsOfExperience'] = bp.yearsOfExperience
      if (bp.supportServices !== undefined) setData['brokerPage.supportServices'] = bp.supportServices
      if (bp.operatingAreas !== undefined) setData['brokerPage.operatingAreas'] = bp.operatingAreas
      // Preserve expireAt unless explicitly provided
      if (bp.expireAt !== undefined) setData['brokerPage.expireAt'] = bp.expireAt
      if (bp.slug !== undefined) setData['brokerPage.slug'] = bp.slug
      if (bp.bio !== undefined) setData['brokerPage.bio'] = bp.bio
      if (bp.coverImage !== undefined) setData['brokerPage.coverImage'] = bp.coverImage
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: setData },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const user = await userModel.findById(userId)
    
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Verify old password
    const isPasswordValid = bcryptjs.compareSync(oldPassword, user.password)
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Old password is incorrect')
    }

    // Hash new password
    const hashedPassword = bcryptjs.hashSync(newPassword, 10)

    // Update password
    await userModel.findByIdAndUpdate(userId, { password: hashedPassword })

    return { message: 'Password changed successfully' }
  } catch (error) {
    throw error
  }
}

const requestAgentRole = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (user.role === 'agent') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You are already an agent')
    }

    if (user.agentRequestStatus === 'pending') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Your agent request is already pending')
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { agentRequestStatus: 'pending' },
      { new: true }
    )

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const removeAgentRole = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (user.role !== 'agent') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You are not an agent')
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { 
        role: 'user',
        agentRequestStatus: 'none',
        // Clear agent-specific fields
        companyName: null,
        agentTitle: null,
        bio: null,
        specializations: [],
        areasServed: [],
        experience: null,
        licenseNumber: null,
        website: null,
        socialLinks: { facebook: null, linkedin: null, twitter: null }
      },
      { new: true }
    )

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const getAllAgents = async (searchQuery = '', page = 1, limit = 12) => {
  try {
    const skip = (page - 1) * limit
    
    // Include both agents and regular users so the directory shows everyone
    const query = {
      role: { $in: ['agent', 'user'] },
      isActive: true
    }

    if (searchQuery) {
      query.$or = [
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { userName: { $regex: searchQuery, $options: 'i' } },
        { companyName: { $regex: searchQuery, $options: 'i' } },
        { areasServed: { $regex: searchQuery, $options: 'i' } }
      ]
    }

    const agents = await userModel
      .find(query)
      .select('-password -verifyToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await userModel.countDocuments(query)

    return {
      agents: agents.map(agent => pickUser(agent)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    throw error
  }
}

const getAgentById = async (agentId) => {
  try {
    const agent = await userModel
      .findOne({ _id: agentId, role: 'agent', isActive: true })
      .select('-password -verifyToken')

    if (!agent) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Agent not found')
    }

    return pickUser(agent)
  } catch (error) {
    throw error
  }
}

const getUserProfileById = async (userId) => {
  try {
    const user = await userModel
      .findOne({ _id: userId, isActive: true })
      .select('-password -verifyToken')

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    return pickUser(user)
  } catch (error) {
    throw error
  }
}

const updatePhone = async (userId, phone) => {
  const updated = await userModel.findByIdAndUpdate(
    userId,
    { phone },
    { new: true }
  ).select('-password -verifyToken -__v')

  if (!updated) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  return updated
}

const updateMembership = async (userId, membershipLevel, billingCycle) => {
  try {
    const durationDays = billingCycle === 'yearly' ? 365 : 30
    const membershipExpireAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

    const user = await userModel.findByIdAndUpdate(
      userId,
      {
        membershipLevel,
        membershipExpireAt,
        membershipBillingCycle: billingCycle
      },
      { new: true }
    ).select('-password -verifyToken')

    return user
  } catch (error) {
    throw error
  }
}

const getAgentDashboardStats = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (user.role == 'user') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'User is not an agent')
    }

    // Get all properties - BỎ _destroy filter
    const allProperties = await propertyModel.find({ 
      owner: userId
    })
    .sort({ createdAt: -1 }) // Sort by newest first
    .lean() // Optimize query

    // Count by status
    const totalProperties = allProperties.length
    const activeListings = allProperties.filter(p => p.status === 'active').length
    const draftProperties = allProperties.filter(p => p.status === 'draft').length
    const hiddenProperties = allProperties.filter(p => p.status === 'hidden').length
    const soldProperties = allProperties.filter(p => p.status === 'sold').length
    const rentedProperties = allProperties.filter(p => p.status === 'rented').length

    // Calculate total views from UserActivity collection
    const UserActivity = mongoose.model('UserActivity')
    const propertyIds = allProperties.map(p => p._id)
    
    const totalViews = await UserActivity.countDocuments({
      propertyId: { $in: propertyIds },
      eventType: 'VIEW'
    })

    // Get followers count - BỎ _destroy filter
    const followersCount = await agentFollowModel.countDocuments({
      agent: userId
    })

    // Get reviews stats - BỎ _destroy filter
    const reviews = await agentReviewModel.find({
      agent: userId
    })
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    return {
      totalProperties,
      activeListings,
      draftProperties,
      hiddenProperties,
      soldProperties,
      rentedProperties,
      totalViews,
      followersCount,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      // ✅ Thêm danh sách properties
      properties: allProperties
    }
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  verifyPhoneRegistration, // ✅ Export function verify phone registration
  login,
  loginWithGoogle,
  refreshToken,
  updateProfile,
  changePassword,
  requestAgentRole,
  removeAgentRole,
  getAllAgents,
  getAgentById,
  getUserProfileById,
  updatePhone,
  updateMembership,
  getAgentDashboardStats
}