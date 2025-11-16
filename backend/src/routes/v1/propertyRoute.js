import express from 'express'
import { propertyController } from '~/controllers/propertyController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles } from '~/middlewares/uploadMiddleware'
import { propertyValidation } from '~/validations/propertyValidation'

const router = express.Router()

router.route('/')
  .get(propertyController.getProperties, propertyValidation.getProperties)
  .post(authMiddleware.isAuthorized, uploadFiles, propertyController.createProperty)

router.route('/map')
  .get(propertyController.getPropertiesWithMap)

router.route('/nl-search')
  .post(propertyController.naturalLanguageSearch)

router.route('/in')
  .post(propertyController.getPropertiesWithinPolygon)

router.route('/:id')
  .get(propertyController.getPropertyDetails)

// Image Tagging Routes
router.route('/user/properties-with-media')
  .get(authMiddleware.isAuthorized, propertyController.getUserPropertiesWithMedia)

router.route('/user/image-tags')
  .get(authMiddleware.isAuthorized, propertyController.getAllUserImageTags)

router.route('/search-by-tag')
  .get(propertyController.searchPropertiesByTag)

router.route('/analyze-temp-image')
  .post(authMiddleware.isAuthorized, uploadFiles, propertyController.analyzeTemporaryImage)

router.route('/:propertyId/images/:imageId/analyze')
  .post(authMiddleware.isAuthorized, propertyController.analyzePropertyImage)

router.route('/:propertyId/images/:imageId/tags')
  .put(authMiddleware.isAuthorized, propertyController.updatePropertyImageTags)
  .delete(authMiddleware.isAuthorized, propertyController.clearImageTags)

router.route('/:propertyId/images/bulk-analyze')
  .post(authMiddleware.isAuthorized, propertyController.bulkAnalyzeImages)

export const propertyRoutes = router