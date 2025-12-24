import systemConfigService from "~/services/systemConfigService";

class SystemConfigController {
    // GET /api/system-configs
    async getAllConfigs(req, res) {
        try {
            const configs = await systemConfigService.getAllConfigs();
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách config thành công',
                data: configs,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    // GET /api/system-configs/:key
    async getConfigByKey(req, res) {
        try {
            const { key } = req.params;
            const config = await systemConfigService.getConfigByKey(key);
            res.status(200).json({
                success: true,
                message: 'Lấy config thành công',
                data: config,
            });
        } catch (error) {
            const statusCode = error.message === 'Không tìm thấy config' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    // POST /api/system-configs
    async createConfig(req, res) {
        try {
            const config = await systemConfigService.createConfig(req.body);
            res.status(201).json({
                success: true,
                message: 'Tạo config thành công',
                data: config,
            });
        } catch (error) {
            const statusCode = error.message === 'Key đã tồn tại' ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    // PUT /api/system-configs/:key
    async updateConfig(req, res) {
        try {
            const { key } = req.params;
            const config = await systemConfigService.updateConfig(key, req.body);
            res.status(200).json({
                success: true,
                message: 'Cập nhật config thành công',
                data: config,
            });
        } catch (error) {
            const statusCode = error.message === 'Không tìm thấy config' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    // DELETE /api/system-configs/:key
    async deleteConfig(req, res) {
        try {
            const { key } = req.params;
            await systemConfigService.deleteConfig(key);
            res.status(200).json({
                success: true,
                message: 'Xóa config thành công',
            });
        } catch (error) {
            const statusCode = error.message === 'Không tìm thấy config' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message,
            });
        }
    }

    // POST /api/system-configs/upsert
    async upsertConfig(req, res) {
        try {
            const { key, value, description } = req.body;
            if (!key || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Key và value là bắt buộc',
                });
            }

            const config = await systemConfigService.upsertConfig(key, value, description);
            res.status(200).json({
                success: true,
                message: 'Upsert config thành công',
                data: config,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

export default new SystemConfigController();