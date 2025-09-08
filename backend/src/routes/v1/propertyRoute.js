import express from 'express'
import { propertyController } from '~/controllers/propertyController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles } from '~/middlewares/uploadMiddleware'
import { propertyValidation } from '~/validations/propertyValidation'

const router = express.Router()

router.post('/',authMiddleware.isAuthorized, uploadFiles, propertyController.createProperty)

router.route('/')
  .get(propertyController.getProperties, propertyValidation.getProperties)

export const propertyRoutes = router