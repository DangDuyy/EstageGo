import { StatusCodes } from "http-status-codes"
import { pickUser } from "~/utils/formatter"
import bcryptjs from 'bcryptjs'
import { JwtProvider } from "~/providers/JwtProvider"
import ApiError from "~/utils/ApiError"
import { env } from "~/config/environment"
import userModel from "~/models/users"

const createNew = async (reqBody) => {
  //
}

const verifyAccount = async (reqBody) => {
  try {
    const existUser = await userModel.findOne({email: reqBody.email})

  if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
  if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is already active')
  if (reqBody.token !== existUser.verifyToken) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid')

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
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is not active')

    //bcrypt: so sanh pass truoc va sau khi hash
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

    return { accessToken, refreshToken, ...pickUser(existUser)}
  } catch (error) {
    throw new Error(error)
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SECRET_SIGNATURE)

    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }

    //tao accesstoken moi
    const accessToken = await JwtProvider.generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE, env.ACCESS_TOKEN_LIFE)

    return { accessToken }
  } catch (error) {
    throw new Error(error)
  }
}

const updateProfile = async (userId, updateData) => {
  try {
    // Remove fields that should not be updated
    const { password, email, phone, userName, role, isActive, verifyToken, ...allowedUpdates } = updateData

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
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

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  updateProfile,
  changePassword
}