import { StatusCodes } from "http-status-codes"
import { userService } from "~/services/userService"
import ApiError from "~/utils/ApiError"
import ms from "ms"
import { env } from "~/config/environment"

const createNew = async (req, res, next) => {
  try {
    const result = await userService.createNew(req.body)
    return res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body)

    const isProd = env.BUILD_MODE === 'production'
    const accessTokenLife = env.ACCESS_TOKEN_LIFE || '1h'
    const refreshTokenLife = env.REFRESH_TOKEN_LIFE || '14 days'

    const commonCookie = {
      httpOnly: true,
      secure: isProd, // only true on HTTPS
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

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    //gui accesstoken moi dua tren refreshToken
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
    next(new ApiError(StatusCodes.FORBIDDEN, 'Please Sign in again! (Error from refreshToken) '))
  }
}

const sendVerificationCode = async (req, res, next) => {
  try {
    const result = await userService.sendVerificationCode(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const verifyCode = async (req, res, next) => {
  try {
    const result = await userService.verifyCode(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  createNew,
  login,
  verifyAccount,
  logout,
  refreshToken,
  sendVerificationCode,
  verifyCode
}