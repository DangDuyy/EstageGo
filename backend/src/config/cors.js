import { StatusCodes } from "http-status-codes"
import { env } from "./environment"
import ApiError from "~/utils/ApiError"

export const corsOptions = {
  origin: function (origin, callback) {
    if (env.BUILD_MODE === 'dev')
      return callback(null, true)

    //deploy len production sau ...

    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },

  optionsSuccessStatus: 200,

  credentials: true
}
