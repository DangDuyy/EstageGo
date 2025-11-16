import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import userModel from '~/models/users';

// Middleware để kiểm tra user có role admin không
export const requireAdmin = async (req, res, next) => {
  try {
    // Kiểm tra xem user đã được authenticate chưa
    if (!req.jwtDecoded || !req.jwtDecoded._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
    }

    // Lấy user từ database để kiểm tra role
    const user = await userModel.findById(req.jwtDecoded._id).select('-password -verifyToken');
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    // Kiểm tra role admin
    if (user.role !== 'admin') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Admin access required');
    }

    // Gắn user vào request để sử dụng trong controller
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware để kiểm tra user có role admin hoặc agent không
export const requireAdminOrAgent = async (req, res, next) => {
  try {
    if (!req.jwtDecoded || !req.jwtDecoded._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
    }

    const user = await userModel.findById(req.jwtDecoded._id).select('-password -verifyToken');
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    if (user.role !== 'admin' && user.role !== 'agent') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Admin or Agent access required');
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
