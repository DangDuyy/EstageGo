import multer from 'multer'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const storage = multer.memoryStorage()

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = [
//     'image/jpeg', 'image/png', 'image/webp',
//     'video/mp4', 'video/mov',
//     'application/pdf'
//   ]
  
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true)
//   } else {
//     cb(new ApiError(StatusCodes.BAD_REQUEST, 'File type not allowed'), false)
//   }
// }

const upload = multer({
  storage,
//   fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

export const uploadFiles = upload.array('files', 10)