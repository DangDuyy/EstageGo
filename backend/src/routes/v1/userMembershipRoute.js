import express from 'express';
import userMembershipController from '~/controllers/userMembershipController';
import { authMiddleware } from '~/middlewares/authMiddleware';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware.isAuthorized);

// Đăng ký gói membership
router.post('/subscribe', userMembershipController.subscribe);

// Lấy gói đang hoạt động
router.get('/active', userMembershipController.getActiveMembership);

// Lấy lịch sử membership
router.get('/my-memberships', userMembershipController.getMyMemberships);

// Sử dụng tin tặng
router.post('/use-listing', userMembershipController.useIncludedListing);

// Kiểm tra tin tặng còn lại
router.get('/check-listings', userMembershipController.checkRemainingListings);

// Gia hạn membership
// router.post('/renew', userMembershipController.renewMembership);

// Hủy membership
// router.delete('/cancel', userMembershipController.cancelMembership);

// Thống kê
router.get('/stats', userMembershipController.getMembershipStats);

export const userMembershipRouters = router;