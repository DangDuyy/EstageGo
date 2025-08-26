import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
// import { env } from '~/config/environment'

// Middleware xử lý lỗi tập trung trong ứng dụng Back-end NodeJS (ExpressJS)
export const errorHandlingMiddleware = (err, req, res, next) => {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  const responseError = {
    message: err.message || StatusCodes[err.statusCode]
  }

  // Ở môi trường dev có thể bổ sung thêm thông tin phục vụ debug
  if (env.BUILD_MODE === 'dev') {
    responseError.statusCode = err.statusCode
    responseError.name = err.name
    responseError.stack = err.stack
  }

  res.status(err.statusCode).json(responseError)
}