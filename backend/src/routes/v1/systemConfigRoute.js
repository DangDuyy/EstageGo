import express from 'express';
import systemConfigController from '~/controllers/systemConfigController';

const router = express.Router();

// Lấy tất cả config
router.get('/', systemConfigController.getAllConfigs);

// Upsert config (phải đặt trước route /:key để tránh conflict)
router.post('/upsert', systemConfigController.upsertConfig);

// Lấy config theo key
router.get('/:key', systemConfigController.getConfigByKey);

// Tạo config mới
router.post('/', systemConfigController.createConfig);

// Cập nhật config theo key
router.put('/:key', systemConfigController.updateConfig);

// Xóa config theo key
router.delete('/:key', systemConfigController.deleteConfig);

export const systemConfigRoutes = router;