import express from 'express'
import { propertyController } from '~/controllers/propertyController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { uploadFiles, uploadVerificationDocs } from '~/middlewares/uploadMiddleware'
import { propertyValidation } from '~/validations/propertyValidation'

const router = express.Router()

router.route('/')
  .get(propertyController.getProperties, propertyValidation.getProperties)
  .post(authMiddleware.isAuthorized, uploadFiles, propertyController.createProperty)

router.route('/verify-documents')
  .post(authMiddleware.isAuthorized, uploadVerificationDocs, propertyController.verifyPropertyDocuments)

router.route('/map')
  .get(propertyController.getPropertiesWithMap)

router.route('/province-summary')
  .get(propertyController.getPropertiesGroupedByProvince)

router.route('/nl-search')
  .post(propertyController.naturalLanguageSearch)

router.route('/in')
  .post(propertyController.getPropertiesWithinPolygon)

// Image Tagging Routes
router.route('/user/properties-with-media')
  .get(authMiddleware.isAuthorized, propertyController.getUserPropertiesWithMedia)

router.route('/user/image-tags')
  .get(authMiddleware.isAuthorized, propertyController.getAllUserImageTags)

router.route('/search-by-tag')
  .get(propertyController.searchPropertiesByTag)

router.route('/:id')
  .get(propertyController.getPropertyDetails)
  .put(authMiddleware.isAuthorized, propertyController.updateProperty)
  .delete(authMiddleware.isAuthorized, propertyController.deleteProperty)

// Boost routes
router.route('/:id/boost')
  .post(authMiddleware.isAuthorized, propertyController.boostProperty)

router.route('/boost/batch')
  .post(authMiddleware.isAuthorized, propertyController.boostMultipleProperties)

router.route('/boost/purchase-package')
  .post(authMiddleware.isAuthorized, propertyController.purchaseBoostPackage)

router.route('/analyze-temp-image')
  .post(authMiddleware.isAuthorized, uploadFiles, propertyController.analyzeTemporaryImage)

router.route('/:propertyId/images/:imageId/analyze')
  .post(authMiddleware.isAuthorized, propertyController.analyzePropertyImage)

router.route('/:propertyId/images/:imageId/tags')
  .put(authMiddleware.isAuthorized, propertyController.updatePropertyImageTags)
  .delete(authMiddleware.isAuthorized, propertyController.clearImageTags)

router.route('/:propertyId/images/bulk-analyze')
  .post(authMiddleware.isAuthorized, propertyController.bulkAnalyzeImages)

// Add new routes
router.route('/:propertyId/status')
  .patch(authMiddleware.isAuthorized, propertyController.updatePropertyStatus)

router.route('/:propertyId/visibility')
  .patch(authMiddleware.isAuthorized, propertyController.updatePropertyVisibility)

export const propertyRoutes = router