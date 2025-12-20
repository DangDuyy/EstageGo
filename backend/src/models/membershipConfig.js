// ===========================
// Cấu hình các gói hội viên
// ===========================
import mongoose from "mongoose";

const membershipConfigSchema = new mongoose.Schema({
  membershipType: {
    type: String,
    enum: ['basic', 'boosted', 'advanced'],
    required: true,
    unique: true
  },
  displayName: {
    vi: String,
    en: String
  },
  includedListings: {
    tier: {
      type: String,
      enum: ['basic', 'boosted', 'advanced'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  },
  features: {
    unlimitedListings: { type: Boolean, default: true },
    // performanceReport: { type: Boolean, default: false },
    brokerPage: { type: Boolean, default: false },
    // fastApproval: { type: Boolean, default: false },
    // hideOtherBrokers: { type: Boolean, default: false },
    // externalShare: { type: Boolean, default: false }
  },
  pricing: [{
    durationMonths: Number,
    price: Number, // VNĐ
    discount: Number // % giảm giá
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

membershipConfigSchema.index({ membershipType: 1 });

export const MembershipConfig = mongoose.model('MembershipConfig', membershipConfigSchema);