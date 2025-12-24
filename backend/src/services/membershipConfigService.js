import { MembershipConfig } from "~/models/membershipConfig";

class MembershipConfigService {
  // Lấy tất cả cấu hình gói hội viên
  async getAllConfigs(filter = {}) {
    try {
      const query = { isActive: true, ...filter };
      const configs = await MembershipConfig.find(query).sort({ membershipType: 1 });
      return configs;
    } catch (error) {
      throw new Error(`Error fetching membership configs: ${error.message}`);
    }
  }

  // Lấy cấu hình theo loại gói
  async getConfigByType(membershipType) {
    try {
      const config = await MembershipConfig.findOne({ 
        membershipType, 
        isActive: true 
      });
      
      if (!config) {
        throw new Error(`Membership config for type '${membershipType}' not found`);
      }
      
      return config;
    } catch (error) {
      throw error;
    }
  }

  // Lấy cấu hình theo ID
  async getConfigById(id) {
    try {
      const config = await MembershipConfig.findById(id);
      
      if (!config) {
        throw new Error('Membership config not found');
      }
      
      return config;
    } catch (error) {
      throw error;
    }
  }

  // Tạo cấu hình mới
  async createConfig(configData) {
    try {
      // Kiểm tra xem loại gói đã tồn tại chưa
      const existingConfig = await MembershipConfig.findOne({ 
        membershipType: configData.membershipType 
      });
      
      if (existingConfig) {
        throw new Error(`Membership config for type '${configData.membershipType}' already exists`);
      }

      const newConfig = new MembershipConfig(configData);
      await newConfig.save();
      
      return newConfig;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật cấu hình
  async updateConfig(membershipType, updateData) {
    try {
      // Không cho phép thay đổi membershipType
      delete updateData.membershipType;

      const config = await MembershipConfig.findOneAndUpdate(
        { membershipType },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!config) {
        throw new Error(`Membership config for type '${membershipType}' not found`);
      }

      return config;
    } catch (error) {
      throw error;
    }
  }

  // Xóa mềm (deactivate) cấu hình
  async deactivateConfig(membershipType) {
    try {
      const config = await MembershipConfig.findOneAndUpdate(
        { membershipType },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!config) {
        throw new Error(`Membership config for type '${membershipType}' not found`);
      }

      return config;
    } catch (error) {
      throw error;
    }
  }

  // Kích hoạt lại cấu hình
  async activateConfig(membershipType) {
    try {
      const config = await MembershipConfig.findOneAndUpdate(
        { membershipType },
        { $set: { isActive: true } },
        { new: true }
      );

      if (!config) {
        throw new Error(`Membership config for type '${membershipType}' not found`);
      }

      return config;
    } catch (error) {
      throw error;
    }
  }

  // Xóa vĩnh viễn cấu hình
  async deleteConfig(membershipType) {
    try {
      const config = await MembershipConfig.findOneAndDelete({ membershipType });

      if (!config) {
        throw new Error(`Membership config for type '${membershipType}' not found`);
      }

      return config;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật giá theo thời hạn
  async updatePricing(membershipType, pricingData) {
    try {
      const config = await MembershipConfig.findOne({ membershipType });

      if (!config) {
        throw new Error(`Membership config for type '${membershipType}' not found`);
      }

      // Tìm và cập nhật giá theo durationMonths hoặc thêm mới
      const existingPriceIndex = config.pricing.findIndex(
        p => p.durationMonths === pricingData.durationMonths
      );

      if (existingPriceIndex > -1) {
        config.pricing[existingPriceIndex] = pricingData;
      } else {
        config.pricing.push(pricingData);
      }

      await config.save();
      return config;
    } catch (error) {
      throw error;
    }
  }

  // Thống kê usage của membership configs
  async getUsageStats() {
    try {
      const { UserMembership } = await import('~/models/userMembership.js');
      
      const configs = await MembershipConfig.find({ isActive: true });
      const stats = await Promise.all(
        configs.map(async (config) => {
          // Đếm số user đang active với membership này
          const activeUsers = await UserMembership.countDocuments({
            membershipType: config.membershipType,
            endDate: { $gte: new Date() }
          });

          // Tổng số user đã từng sử dụng
          const totalUsers = await UserMembership.countDocuments({
            membershipType: config.membershipType
          });

          // Tính tổng revenue (giả sử lấy từ pricing đầu tiên)
          const totalRevenue = await UserMembership.aggregate([
            { $match: { membershipType: config.membershipType } },
            { $group: { _id: null, total: { $sum: '$payment.amount' } } }
          ]);

          return {
            membershipType: config.membershipType,
            displayName: config.displayName,
            activeUsers,
            totalUsers,
            expiredUsers: totalUsers - activeUsers,
            totalRevenue: totalRevenue[0]?.total || 0
          };
        })
      );

      return stats;
    } catch (error) {
      throw new Error(`Error fetching usage stats: ${error.message}`);
    }
  }
}

export default new MembershipConfigService();