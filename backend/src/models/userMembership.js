// ===========================
// Gói hội viên mà user đã mua
// ===========================
import mongoose from "mongoose";

const userMembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  membershipType: {
    type: String,
    enum: ['basic', 'boosted', 'advanced'],
    required: true
  },
  // Số lượng tin tặng kèm
  includedListings: {
    tierType: String,
    total: Number,
    used: { type: Number, default: 0 },
    remaining: { type: Number }
  },
  // status: {
  //   type: String,
  //   enum: ['active', 'expired', 'cancelled'],
  //   default: 'active'
  // },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Thông tin thanh toán
  // payment: {
  //   amount: Number,
  //   method: String,
  //   transactionId: String,
  //   paidAt: Date
  // },
  // autoRenew: {
  //   type: Boolean,
  //   default: false
  // },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index cho query hiệu quả
userMembershipSchema.index({ userId: 1, status: 1 });
userMembershipSchema.index({ endDate: 1, status: 1 });

// Virtual để check còn tin tặng không
userMembershipSchema.virtual('hasRemainingListings').get(function() {
  return this.includedListings.remaining > 0;
});

// Method để sử dụng tin tặng
userMembershipSchema.methods.useIncludedListing = function() {
  if (this.includedListings.remaining > 0) {
    this.includedListings.used += 1;
    this.includedListings.remaining -= 1;
    return true;
  }
  return false;
};

export const UserMembership = mongoose.model('UserMembership', userMembershipSchema);