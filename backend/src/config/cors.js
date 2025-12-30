import { StatusCodes } from "http-status-codes"
import { env } from "./environment"
import ApiError from "~/utils/ApiError"

const allowedOrigins = [
  env.FRONTEND_URL,        // FE dev
  env.FRONTEND_PROD_URL    // FE production
]

export const corsOptions = {
  origin: function (origin, callback) {
    if (env.BUILD_MODE === 'dev') {
      // Cho phép mọi origin khi dev
      return callback(null, true)
    }

    // Production: kiểm tra origin từ .env
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },

  optionsSuccessStatus: 200,
  credentials: true
}
