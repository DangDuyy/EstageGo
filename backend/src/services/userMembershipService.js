import { MembershipConfig } from "~/models/membershipConfig";
import { UserMembership } from "~/models/userMembership";
import userModel from "~/models/users";

class UserMembershipService {
  // Đăng ký gói membership mới
  async subscribe(userId, membershipType, durationMonths) {
    try {
      // 1. Lấy thông tin config gói membership
      const config = await MembershipConfig.findOne({ 
        membershipType, 
        isActive: true 
      });

      if (!config) {
        throw new Error(`Membership type '${membershipType}' not found or inactive`);
      }

      // 2. Tìm giá theo thời hạn
    //   const pricing = config.pricing.find(p => p.durationMonths === durationMonths);
    //   if (!pricing) {
    //     throw new Error(`Pricing for ${durationMonths} months not found`);
    //   }

      // 3. Kiểm tra gói đang hoạt động
      const existingMembership = await this.getActiveMembership(userId);
      if (existingMembership) {
        throw new Error('User already has an active membership. Please cancel or wait for expiration.');
      }

      // 4. Tính ngày bắt đầu và kết thúc
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + config.pricing[0].durationMonths);

      // 5. Tạo subscription mới
      const subscription = new UserMembership({
        userId,
        membershipType,
        includedListings: {
          tierType: config.includedListings.tier,
          total: config.includedListings.quantity,
          used: 0,
          remaining: config.includedListings.quantity
        },
        startDate,
        endDate,
        // payment: {
        //   amount: pricing.price,
        //   method: paymentMethod,
        //   transactionId: transactionId,
        //   paidAt: new Date()
        // }
      });

      await subscription.save();

      const user = await userModel.findById(userId)
      user.brokerPage.expireAt = endDate
      user.save()

      return {
        subscription,
        config,
        // pricing
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy gói membership đang hoạt động
  async getActiveMembership(userId) {
    try {
      const now = new Date();
      const membership = await UserMembership.findOne({
        userId,
        startDate: { $lte: now },
        endDate: { $gte: now }
      })
    //   .populate('userId', 'name email');

      return membership;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả membership của user (bao gồm cả hết hạn)
  async getUserMemberships(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      
      const query = { userId };
      const now = new Date();

      // Filter theo status nếu có
      if (status === 'active') {
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
      } else if (status === 'expired') {
        query.endDate = { $lt: now };
      }

      const memberships = await UserMembership.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await UserMembership.countDocuments(query);

      return {
        memberships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Sử dụng tin tặng
  async useIncludedListing(userId) {
    try {
      const membership = await this.getActiveMembership(userId);

      if (!membership) {
        throw new Error('No active membership found');
      }

      const success = membership.useIncludedListing();
      
      if (!success) {
        throw new Error('No remaining included listings');
      }

      await membership.save();

      return membership;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra còn tin tặng không
  async checkRemainingListings(userId) {
    try {
      const membership = await this.getActiveMembership(userId);

      if (!membership) {
        return {
          hasActiveMembership: false,
          remaining: 0
        };
      }

      return {
        hasActiveMembership: true,
        membershipType: membership.membershipType,
        remaining: membership.includedListings.remaining,
        total: membership.includedListings.total,
        used: membership.includedListings.used
      };
    } catch (error) {
      throw error;
    }
  }

  // Gia hạn membership
  async renewMembership(userId, durationMonths) {
    try {
      const currentMembership = await this.getActiveMembership(userId);

      if (!currentMembership) {
        throw new Error('No active membership to renew');
      }

      // Lấy config để tính giá
      const config = await MembershipConfig.findOne({ 
        membershipType: currentMembership.membershipType,
        isActive: true 
      });

      const pricing = config.pricing.find(p => p.durationMonths === durationMonths);
      if (!pricing) {
        throw new Error(`Pricing for ${durationMonths} months not found`);
      }

      // Tính endDate mới (kéo dài từ endDate hiện tại)
      const newEndDate = new Date(currentMembership.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      currentMembership.endDate = newEndDate;
      await currentMembership.save();

      return {
        membership: currentMembership,
        pricing
      };
    } catch (error) {
      throw error;
    }
  }

  // Hủy membership (soft delete - đánh dấu hết hạn ngay)
  async cancelMembership(userId) {
    try {
      const membership = await this.getActiveMembership(userId);

      if (!membership) {
        throw new Error('No active membership found');
      }

      // Đặt endDate = now để hết hạn ngay
      membership.endDate = new Date();
      await membership.save();

      return membership;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê membership
  async getMembershipStats(userId) {
    try {
      const activeMembership = await this.getActiveMembership(userId);
      const allMemberships = await UserMembership.find({ userId });

      const stats = {
        hasActiveMembership: !!activeMembership,
        currentMembership: activeMembership ? {
          type: activeMembership.membershipType,
          startDate: activeMembership.startDate,
          endDate: activeMembership.endDate,
          daysRemaining: Math.ceil((activeMembership.endDate - new Date()) / (1000 * 60 * 60 * 24)),
          includedListings: activeMembership.includedListings
        } : null,
        totalSubscriptions: allMemberships.length,
        totalSpent: allMemberships.reduce((sum, m) => sum + (m.payment?.amount || 0), 0)
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Tự động kiểm tra và cập nhật trạng thái (chạy định kỳ)
  async checkExpiredMemberships() {
    try {
      const now = new Date();
      
      const expiredMemberships = await UserMembership.find({
        endDate: { $lt: now },
        status: 'active'
      });

      // Cập nhật status thành expired
      for (const membership of expiredMemberships) {
        membership.status = 'expired';
        await membership.save();
      }

      return {
        count: expiredMemberships.length,
        memberships: expiredMemberships
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new UserMembershipService();