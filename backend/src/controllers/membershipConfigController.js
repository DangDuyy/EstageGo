import membershipConfigService from "~/services/membershipConfigService";

class MembershipConfigController {
  // GET /api/membership-configs - Lấy tất cả cấu hình
  async getAllConfigs(req, res) {
    try {
      const { isActive } = req.query;
      const filter = {};
      
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const configs = await membershipConfigService.getAllConfigs(filter);
      
      res.status(200).json({
        success: true,
        data: configs,
        count: configs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/membership-configs/:type - Lấy cấu hình theo loại
  async getConfigByType(req, res) {
    try {
      const { type } = req.params;
      const config = await membershipConfigService.getConfigByType(type);
      
      res.status(200).json({
        success: true,
        data: config
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/membership-configs - Tạo cấu hình mới
  async createConfig(req, res) {
    try {
      const configData = req.body;
      const newConfig = await membershipConfigService.createConfig(configData);
      
      res.status(201).json({
        success: true,
        message: 'Membership config created successfully',
        data: newConfig
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/membership-configs/:type - Cập nhật cấu hình
  async updateConfig(req, res) {
    try {
      const { type } = req.params;
      const updateData = req.body;
      
      const updatedConfig = await membershipConfigService.updateConfig(type, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Membership config updated successfully',
        data: updatedConfig
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PATCH /api/membership-configs/:type/deactivate - Vô hiệu hóa
  async deactivateConfig(req, res) {
    try {
      const { type } = req.params;
      const config = await membershipConfigService.deactivateConfig(type);
      
      res.status(200).json({
        success: true,
        message: 'Membership config deactivated successfully',
        data: config
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PATCH /api/membership-configs/:type/activate - Kích hoạt
  async activateConfig(req, res) {
    try {
      const { type } = req.params;
      const config = await membershipConfigService.activateConfig(type);
      
      res.status(200).json({
        success: true,
        message: 'Membership config activated successfully',
        data: config
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /api/membership-configs/:type - Xóa vĩnh viễn
  async deleteConfig(req, res) {
    try {
      const { type } = req.params;
      await membershipConfigService.deleteConfig(type);
      
      res.status(200).json({
        success: true,
        message: 'Membership config deleted successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // PUT /api/membership-configs/:type/pricing - Cập nhật giá
  async updatePricing(req, res) {
    try {
      const { type } = req.params;
      const pricingData = req.body;
      
      const updatedConfig = await membershipConfigService.updatePricing(type, pricingData);
      
      res.status(200).json({
        success: true,
        message: 'Pricing updated successfully',
        data: updatedConfig
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/membership-configs/stats/usage - Thống kê usage
  async getUsageStats(req, res) {
    try {
      const stats = await membershipConfigService.getUsageStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new MembershipConfigController();