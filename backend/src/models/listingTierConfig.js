import mongoose from "mongoose";
// ===========================
// Cấu hình các hạng tin (Basic, Boosted, Advanced)
// ===========================
const listingTierConfigSchema = new mongoose.Schema({
    tierName: {
        type: String,
        enum: ['basic', 'boosted', 'advanced'],
        required: true,
        unique: true
    },
    displayName: {
        vi: String,
        en: String
    },
    priority: {
        type: Number,
        required: true // basic: 1, boosted: 2, advanced: 3
    },
    features: {
        featuredListing: Boolean, // Tin nổi bật (chỉ Advanced)
    },
    durations: [{
        days: Number,
        price: Number // VNĐ (chưa bao gồm VAT)
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

listingTierConfigSchema.index({ tierName: 1 });

export const ListingTierConfig = mongoose.model('ListingTierConfig', listingTierConfigSchema);