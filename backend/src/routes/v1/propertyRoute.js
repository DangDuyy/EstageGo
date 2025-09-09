import express from 'express'
import { propertyController } from '~/controllers/propertyController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles } from '~/middlewares/uploadMiddleware'
import { propertyValidation } from '~/validations/propertyValidation'

const router = express.Router()

router.route('/')
  .get(propertyController.getProperties, propertyValidation.getProperties)
  .post(authMiddleware.isAuthorized, uploadFiles, propertyController.createProperty)

router.route('/:id')
  .get(propertyController.getPropertyDetails)

export const propertyRoutes = router