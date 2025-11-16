import { StatusCodes } from 'http-status-codes';
import agentRequestModel from '~/models/agentRequests';
import userModel from '~/models/users';
import ApiError from '~/utils/ApiError';

// User tạo agent request
const createAgentRequest = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id;

    // Kiểm tra user đã có request pending chưa
    const existingRequest = await agentRequestModel.findOne({
      userId,
      status: 'pending'
    });

    if (existingRequest) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You already have a pending agent request');
    }

    // Kiểm tra user đã là agent chưa
    const user = await userModel.findById(userId);
    if (user.role === 'agent' || user.role === 'admin') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'You are already an agent or admin');
    }

    const {
      companyName,
      agentTitle,
      bio,
      specializations,
      areasServed,
      experience,
      licenseNumber,
      website,
      socialLinks
    } = req.body;

    // Tạo agent request
    const agentRequest = await agentRequestModel.create({
      userId,
      companyName,
      agentTitle,
      bio,
      specializations,
      areasServed,
      experience,
      licenseNumber,
      website,
      socialLinks,
      status: 'pending'
    });

    // Cập nhật user agentRequestStatus
    await userModel.findByIdAndUpdate(userId, {
      agentRequestStatus: 'pending'
    });

    res.status(StatusCodes.CREATED).json({
      message: 'Agent request submitted successfully',
      agentRequest
    });
  } catch (error) {
    next(error);
  }
};

// User xem agent request của mình
const getMyAgentRequest = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id;

    const request = await agentRequestModel
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'fullName email')
      .lean();

    if (!request) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: 'No agent request found'
      });
    }

    res.status(StatusCodes.OK).json({
      request
    });
  } catch (error) {
    next(error);
  }
};

// User hủy agent request (chỉ khi pending)
const cancelAgentRequest = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id;

    const request = await agentRequestModel.findOne({
      userId,
      status: 'pending'
    });

    if (!request) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No pending agent request found');
    }

    await agentRequestModel.findByIdAndDelete(request._id);

    // Cập nhật user agentRequestStatus
    await userModel.findByIdAndUpdate(userId, {
      agentRequestStatus: 'none'
    });

    res.status(StatusCodes.OK).json({
      message: 'Agent request cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const agentRequestController = {
  createAgentRequest,
  getMyAgentRequest,
  cancelAgentRequest
};
