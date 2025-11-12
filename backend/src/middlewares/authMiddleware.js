const { StatusCodes } = require("http-status-codes")
const { env } = require("~/config/environment")
const { JwtProvider } = require("~/providers/JwtProvider")
const { default: ApiError } = require("~/utils/ApiError")

const isAuthorized = async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
  let clientAccessToken = req.cookies?.accessToken
  
  if (!clientAccessToken) {
    // Fallback to Authorization header (for localStorage usage)
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      clientAccessToken = authHeader.substring(7)
    }
  }
  
  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Unauthorized: {Token not found}'))
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