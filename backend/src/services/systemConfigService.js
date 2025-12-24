import SystemConfig from "~/models/systemConfig";

class SystemConfigService {
    // Lấy tất cả config
    async getAllConfigs() {
        try {
            const configs = await SystemConfig.find().sort({ createdAt: -1 });
            return configs;
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách config: ${error.message}`);
        }
    }

    // Lấy config theo key
    async getConfigByKey(key) {
        try {
            const config = await SystemConfig.findOne({ key });
            if (!config) {
                throw new Error('Không tìm thấy config');
            }
            return config;
        } catch (error) {
            throw error;
        }
    }

    // Tạo config mới
    async createConfig(data) {
        try {
            const existingConfig = await SystemConfig.findOne({ key: data.key });
            if (existingConfig) {
                throw new Error('Key đã tồn tại');
            }

            const config = new SystemConfig(data);
            await config.save();
            return config;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật config theo key
    async updateConfig(key, data) {
        try {
            const config = await SystemConfig.findOneAndUpdate(
                { key },
                { $set: data },
                { new: true, runValidators: true }
            );

            if (!config) {
                throw new Error('Không tìm thấy config');
            }

            return config;
        } catch (error) {
            throw error;
        }
    }

    // Xóa config theo key
    async deleteConfig(key) {
        try {
            const config = await SystemConfig.findOneAndDelete({ key });
            if (!config) {
                throw new Error('Không tìm thấy config');
            }
            return config;
        } catch (error) {
            throw error;
        }
    }

    // Upsert: Cập nhật hoặc tạo mới nếu không tồn tại
    async upsertConfig(key, value, description = '') {
        try {
            const config = await SystemConfig.findOneAndUpdate(
                { key },
                { $set: { value, description } },
                { new: true, upsert: true, runValidators: true }
            );
            return config;
        } catch (error) {
            throw error;
        }
    }
}

export default new SystemConfigService();