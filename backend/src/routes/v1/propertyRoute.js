import express from 'express'
import { propertyController } from '~/controllers/propertyController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles } from '~/middlewares/uploadMiddleware'

const router = express.Router()

router.use(authMiddleware.isAuthorized)
router.post('/', uploadFiles, propertyController.createProperty)

export const propertyRoutes = router