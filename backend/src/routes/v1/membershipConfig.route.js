import express from 'express';
import membershipConfigController from '~/controllers/membershipConfigController';

const router = express.Router();

// Thống kê usage (đặt trước để tránh conflict với :type route)
router.get('/stats/usage', membershipConfigController.getUsageStats);

// Lấy tất cả cấu hình
router.get('/', membershipConfigController.getAllConfigs);

// Lấy user theo gói
router.get('/:type/users', membershipConfigController.getUsersByType);

// Lấy cấu hình theo loại
router.get('/:type', membershipConfigController.getConfigByType);

// Tạo cấu hình mới
router.post('/', membershipConfigController.createConfig);

// Cập nhật cấu hình
router.put('/:type', membershipConfigController.updateConfig);

// Cập nhật giá
router.put('/:type/pricing', membershipConfigController.updatePricing);

// Vô hiệu hóa cấu hình
router.patch('/:type/deactivate', membershipConfigController.deactivateConfig);

// Kích hoạt cấu hình
router.patch('/:type/activate', membershipConfigController.activateConfig);

// Xóa vĩnh viễn
router.delete('/:type', membershipConfigController.deleteConfig);

export const membershipConfigRoute = router;