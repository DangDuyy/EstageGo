import { StatusCodes } from "http-status-codes";
import { MembershipConfig } from "~/models/membershipConfig";
import paymentService from "~/services/paymentService";
import { propertyService } from "~/services/propertyService";
import userMembershipService from "~/services/userMembershipService";

class UserMembershipController {
    // POST /memberships/subscribe - Đăng ký gói mới
    async subscribe(req, res) {
        try {
            const userId = req.jwtDecoded?._id; // Lấy từ auth middleware
            const { membershipType } = req.body;

            // Validation
            if (!membershipType) {
                return res.status(400).json({
                    success: false,
                    message: 'membershipType and durationMonths are required'
                });
            }

            if (!['basic', 'boosted', 'advanced'].includes(membershipType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid membership type'
                });
            }

            //   if (![1, 3, 6, 12].includes(durationMonths)) {
            //     return res.status(400).json({
            //       success: false,
            //       message: 'Duration must be 1, 3, 6, or 12 months'
            //     });
            //   }

            const user = await propertyService.getUserById(userId)
            if (!user) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "User not found" })

            const config = await MembershipConfig.findOne({
                membershipType,
                isActive: true
            });

            const membershipFee = config?.pricing[0].price

            if (membershipFee && user.balance < membershipFee) {
                return res.status(StatusCodes.PAYMENT_REQUIRED).json({
                    success: false,
                    message: "Insufficient balance to pay listing fee",
                    required: membershipFee,
                    currentBalance: user.balance
                })
            }

            const result = await userMembershipService.subscribe(
                userId,
                membershipType,
                // durationMonths
            );

            await paymentService.deductBalance({
                userId: userId,
                amount: membershipFee,
                description: `Membership fee (${config.displayName.en})`,
                referenceId: result.subscription._id
            })

            res.status(201).json({
                success: true,
                message: 'Membership subscribed successfully',
                data: {
                    subscription: result.subscription,
                    config: result.config,
                    pricing: result.pricing
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('already has') ? 409 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /memberships/active - Lấy gói đang hoạt động
    async getActiveMembership(req, res) {
        try {
            const userId = req.jwtDecoded?._id;
            const membership = await userMembershipService.getActiveMembership(userId);

            //   if (!membership) {
            //     return res.status(404).json({
            //       success: false,
            //       message: 'No active membership found'
            //     });
            //   }

            res.status(200).json({
                success: true,
                data: membership
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /memberships/my-memberships - Lấy lịch sử membership
    async getMyMemberships(req, res) {
        try {
            const userId = req.user.id;
            const { page, limit, status } = req.query;

            const result = await userMembershipService.getUserMemberships(userId, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                status
            });

            res.status(200).json({
                success: true,
                data: result.memberships,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /memberships/use-listing - Sử dụng tin tặng
    async useIncludedListing(req, res) {
        try {
            const userId = req.user.id;
            const membership = await userMembershipService.useIncludedListing(userId);

            res.status(200).json({
                success: true,
                message: 'Included listing used successfully',
                data: {
                    remaining: membership.includedListings.remaining,
                    used: membership.includedListings.used
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('No active') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // GET /memberships/check-listings - Kiểm tra tin tặng còn lại
    async checkRemainingListings(req, res) {
        try {
            const userId = req.user.id;
            const result = await userMembershipService.checkRemainingListings(userId);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // POST /memberships/renew - Gia hạn membership
    //   async renewMembership(req, res) {
    //     try {
    //       const userId = req.user.id;
    //       const { durationMonths } = req.body;

    //       if (!durationMonths || ![1, 3, 6, 12].includes(durationMonths)) {
    //         return res.status(400).json({
    //           success: false,
    //           message: 'Duration must be 1, 3, 6, or 12 months'
    //         });
    //       }

    //       const result = await userMembershipService.renewMembership(userId, durationMonths);

    //       res.status(200).json({
    //         success: true,
    //         message: 'Membership renewed successfully',
    //         data: result
    //       });
    //     } catch (error) {
    //       res.status(400).json({
    //         success: false,
    //         message: error.message
    //       });
    //     }
    //   }

    // DELETE /memberships/cancel - Hủy membership
    //   async cancelMembership(req, res) {
    //     try {
    //       const userId = req.user.id;
    //       const membership = await userMembershipService.cancelMembership(userId);

    //       res.status(200).json({
    //         success: true,
    //         message: 'Membership cancelled successfully',
    //         data: membership
    //       });
    //     } catch (error) {
    //       res.status(404).json({
    //         success: false,
    //         message: error.message
    //       });
    //     }
    //   }

    // GET /memberships/stats - Thống kê membership
    async getMembershipStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await userMembershipService.getMembershipStats(userId);

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

export default new UserMembershipController();