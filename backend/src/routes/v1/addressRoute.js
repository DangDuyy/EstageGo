import express from 'express';
import { addressController } from '~/controllers/addressController';

const router = express.Router();

// Province Routes
router.get('/provinces', addressController.getAllProvinces);
router.get('/provinces/:code', addressController.getProvinceByCode);
router.get('/provinces/:code/full', addressController.getProvinceWithFullData);

// District Routes
router.get('/districts', addressController.getAllDistricts);
router.get('/districts/:code', addressController.getDistrictByCode);
router.get('/provinces/:provinceCode/districts', addressController.getDistrictsByProvinceCode);

// Ward Routes
router.get('/wards', addressController.getAllWards);
router.get('/wards/:code', addressController.getWardByCode);
router.get('/districts/:districtCode/wards', addressController.getWardsByDistrictCode);

// Search
router.get('/search', addressController.searchAddress);

// Import data
router.post('/import', addressController.importData);

export const addressRoutes = router