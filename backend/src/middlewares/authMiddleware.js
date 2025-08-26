const { StatusCodes } = require("http-status-codes")
const { env } = require("~/config/environment")
const { JwtProvider } = require("~/providers/JwtProvider")
const { default: ApiError } = require("~/utils/ApiError")

const isAuthorized = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken
  
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Unthorized: {Token not found}'))
    return
  }

  try {
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)

    req.jwtDecoded = accessTokenDecoded

    next()
  }
  catch (error) {
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }

    next(new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Unauthorized'))
  }
}

export const authMiddleware = {
  isAuthorized
}