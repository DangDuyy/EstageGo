import { ListingTierConfig } from "~/models/listingTierConfig.js";

/**
 * Lấy tất cả hạng tin (có filter active)
 */
const getAllListingTiers = async ({ isActive } = {}) => {
    const filter = {};
    if (typeof isActive === "boolean") {
        filter.isActive = isActive;
    }

    return ListingTierConfig
        .find(filter)
        .sort({ priority: 1 }); // basic -> boosted -> advanced
};

/**
 * Lấy hạng tin theo tierName
 */
const getListingTierByName = async (tierName) => {
    return ListingTierConfig.findOne({ tierName });
};

/**
 * Tạo mới hạng tin
 */
const createListingTier = async (data) => {
    const existed = await ListingTierConfig.findOne({ tierName: data.tierName });
    if (existed) {
        throw new Error(`Tier "${data.tierName}" đã tồn tại`);
    }

    const tier = new ListingTierConfig(data);
    return tier.save();
};

/**
 * Cập nhật hạng tin theo tierName
 */
const updateListingTier = async (tierName, updateData) => {
    const updated = await ListingTierConfig.findOneAndUpdate(
        { tierName },
        updateData,
        { new: true }
    );

    if (!updated) {
        throw new Error(`Không tìm thấy tier "${tierName}"`);
    }

    return updated;
};

/**
 * Xóa mềm (disable) hạng tin
 */
const deactivateListingTier = async (tierName) => {
    return updateListingTier(tierName, { isActive: false });
};

/**
 * Kích hoạt lại hạng tin
 */
const activateListingTier = async (tierName) => {
    return updateListingTier(tierName, { isActive: true });
};

/**
 * Lấy cấu hình giá theo số ngày
 */
const getTierPriceByDuration = async (tierName, days) => {
    const tier = await ListingTierConfig.findOne({
        tierName,
        isActive: true
    });

    if (!tier) {
        throw new Error("Tier không tồn tại hoặc đã bị khóa");
    }

    const duration = tier.durations.find(d => d.days === days);
    if (!duration) {
        throw new Error(`Không hỗ trợ gói ${days} ngày`);
    }

    return {
        tierName: tier.tierName,
        days: duration.days,
        price: duration.price
    };
};

/**
 * Cập nhật giá của tier
 */
const updateTierPricing = async (tierName, pricingData) => {
    const tier = await ListingTierConfig.findOne({ tierName });

    if (!tier) {
        throw new Error(`Không tìm thấy tier "${tierName}"`);
    }

    // Tìm và cập nhật giá theo days hoặc thêm mới
    const existingDurationIndex = tier.durations.findIndex(
        d => d.days === pricingData.days
    );

    if (existingDurationIndex > -1) {
        tier.durations[existingDurationIndex] = pricingData;
    } else {
        tier.durations.push(pricingData);
    }

    await tier.save();
    return tier;
};

/**
 * Thống kê usage của listing tiers
 */
const getUsageStats = async () => {
    // Property model được export default
    const Property = (await import('~/models/properties.js')).default;
    
    const tiers = await ListingTierConfig.find({ isActive: true });
    
    const stats = await Promise.all(
        tiers.map(async (tier) => {
            // Đếm số listings đang active: status active và chưa hết hạn (expireAt null hoặc >= now)
            const activeListings = await Property.countDocuments({
                tier: tier._id,
                status: 'active',
                $or: [
                    { expireAt: null },
                    { expireAt: { $gte: new Date() } }
                ]
            });

            // Tổng số listings đã từng sử dụng tier này
            const totalListings = await Property.countDocuments({
                tier: tier._id
            });

            // Listings đã hết hạn (dù status gì) dựa trên expireAt < now
            const expiredListings = await Property.countDocuments({
                tier: tier._id,
                expireAt: { $lt: new Date() }
            });

            return {
                tierName: tier.tierName,
                displayName: tier.displayName,
                priority: tier.priority,
                activeListings,
                totalListings,
                expiredListings
            };
        })
    );

    return stats;
};

/**
 * Lấy danh sách properties theo tier
 */
const getPropertiesByTier = async (tierName) => {
    const tier = await ListingTierConfig.findOne({ tierName });
    if (!tier) {
        throw new Error(`Không tìm thấy tier "${tierName}"`);
    }

    const Property = (await import('~/models/properties.js')).default;

    const properties = await Property.find({ tier: tier._id })
        .sort({ createdAt: -1 })
        .limit(200)
        .select('title status expireAt owner tier createdAt media')
        .populate({ path: 'owner', select: 'fullName email phone avatar' })
        .lean();

    return properties;
};

export const listingTierService = {
    getAllListingTiers,
    getListingTierByName,
    createListingTier,
    updateListingTier,
    deactivateListingTier,
    activateListingTier,
    getTierPriceByDuration,
    updateTierPricing,
    getUsageStats,
    getPropertiesByTier
}