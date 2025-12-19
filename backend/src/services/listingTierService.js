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

export const listingTierService = {
    getAllListingTiers
}