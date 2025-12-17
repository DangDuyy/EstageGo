import { StatusCodes } from 'http-status-codes';
import propertyModel from '~/models/properties';
import userModel from '~/models/users';
import agentRequestModel from '~/models/agentRequests';
import ApiError from '~/utils/ApiError';
import { createAndEmitNotification } from '~/services/notificationService';
import { emitNotification } from '~/sockets';

// ===== DASHBOARD STATISTICS =====
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAgents,
      totalProperties,
      pendingAgentRequests,
      activeProperties,
      soldProperties,
      totalRevenue
    ] = await Promise.all([
      userModel.countDocuments({ isActive: true }),
      userModel.countDocuments({ role: 'agent', isActive: true }),
      propertyModel.countDocuments(),
      agentRequestModel.countDocuments({ status: 'pending' }),
      propertyModel.countDocuments({ status: 'active' }),
      propertyModel.countDocuments({ status: 'sold' }),
      // Tính tổng giá trị properties đã bán (chỉ ước tính)
      propertyModel.aggregate([
        { $match: { status: 'sold' } },
        { $group: { _id: null, total: { $sum: '$price.value' } } }
      ])
    ]);

    // Lấy properties mới nhất
    const recentProperties = await propertyModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'fullName email avatar')
      .lean();

    // Lấy agent requests mới nhất
    const recentAgentRequests = await agentRequestModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName email avatar')
      .lean();

    res.status(StatusCodes.OK).json({
      stats: {
        totalUsers,
        totalAgents,
        totalProperties,
        pendingAgentRequests,
        activeProperties,
        soldProperties,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentProperties,
      recentAgentRequests
    });
  } catch (error) {
    next(error);
  }
};

// ===== PROPERTIES MANAGEMENT =====
const getAllProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      propertyModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('owner', 'fullName email avatar role')
        .lean(),
      propertyModel.countDocuments(query)
    ]);

    res.status(StatusCodes.OK).json({
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePropertyStatus = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { status } = req.body;

    if (!['active', 'hidden', 'sold', 'rented', 'draft'].includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
    }

    const property = await propertyModel.findByIdAndUpdate(
      propertyId,
      { status },
      { new: true }
    ).populate('owner', 'fullName email');

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Property not found');
    }

    // Notify the property owner
    const ownerId = property?.owner?._id || property?.owner

    if (ownerId) {
      await createAndEmitNotification(String(ownerId), {
        type: 'PROPERTY',
        title: 'Property status updated',
        message: `Your property "${property.title}" status is now "${property.status}".`,
        meta: { propertyId: property._id, status: property.status }
      })
    }

    res.status(StatusCodes.OK).json({
      message: 'Property status updated successfully',
      property
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await propertyModel.findByIdAndDelete(propertyId);

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Property not found');
    }

    // Notify the property owner
    const ownerId = property?.owner?._id || property?.owner

    if (ownerId) {
      await createAndEmitNotification(String(ownerId), {
        type: 'PROPERTY',
        title: 'Property deleted',
        message: `Your property "${property.title}" has been deleted by admin.`,
        meta: { propertyId: property._id }
      })
    }

    res.status(StatusCodes.OK).json({
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ===== AGENT REQUESTS MANAGEMENT =====
const getAgentRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      agentRequestModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'fullName email avatar phone address')
        .populate('reviewedBy', 'fullName email')
        .lean(),
      agentRequestModel.countDocuments(query)
    ]);

    res.status(StatusCodes.OK).json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const approveAgentRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const request = await agentRequestModel.findById(requestId);
    if (!request) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Agent request not found');
    }

    if (request.status !== 'pending') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Request already processed');
    }

    // Cập nhật request status
    request.status = 'approved';
    request.adminNotes = adminNotes || null;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Cập nhật user role và thông tin agent
    const user = await userModel.findById(request.userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    user.role = 'agent';
    user.agentRequestStatus = 'approved';
    user.companyName = request.companyName;
    user.agentTitle = request.agentTitle;
    user.bio = request.bio;
    user.specializations = request.specializations;
    user.areasServed = request.areasServed;
    user.experience = request.experience;
    user.licenseNumber = request.licenseNumber;
    user.website = request.website;
    user.socialLinks = request.socialLinks;
    await user.save();

    // Notify user that their agent request was approved
    await createAndEmitNotification(user._id, {
      type: 'ADMIN_ACTION',
      title: 'Agent request approved',
      message: 'Your agent request has been approved. You now have agent privileges.',
      meta: {
        requestId: request._id,
        reviewedAt: request.reviewedAt,
        role: user.role
      }
    });

    res.status(StatusCodes.OK).json({
      message: 'Agent request approved successfully',
      request,
      user
    });
  } catch (error) {
    next(error);
  }
};

const rejectAgentRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const request = await agentRequestModel.findById(requestId);
    if (!request) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Agent request not found');
    }

    if (request.status !== 'pending') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Request already processed');
    }

    // Cập nhật request status
    request.status = 'rejected';
    request.adminNotes = adminNotes || null;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Cập nhật user agentRequestStatus
    await userModel.findByIdAndUpdate(request.userId, {
      agentRequestStatus: 'rejected'
    });

    res.status(StatusCodes.OK).json({
      message: 'Agent request rejected',
      request
    });
  } catch (error) {
    next(error);
  }
};

// ===== USERS MANAGEMENT =====
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      userModel
        .find(query)
        .select('-password -verifyToken')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(query)
    ]);

    res.status(StatusCodes.OK).json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'agent', 'admin'].includes(role)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid role');
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password -verifyToken');

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Notify the user about role update
    await createAndEmitNotification(userId, {
      type: 'ADMIN_ACTION',
      title: 'Role updated',
      message: `Your role has been updated to "${role}".`,
      meta: { role }
    })

    res.status(StatusCodes.OK).json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    user.isActive = !user.isActive;
    await user.save();

    // Notify the user about status change
    const newStatus = user.isActive ? 'active' : 'disabled';
    await createAndEmitNotification(userId, {
      type: 'ADMIN_ACTION',
      title: 'Account status changed',
      message: `Your account status is now "${newStatus}".`,
      meta: { status: newStatus }
    })

    res.status(StatusCodes.OK).json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const adminController = {
  getDashboardStats,
  getAllProperties,
  updatePropertyStatus,
  deleteProperty,
  getAgentRequests,
  approveAgentRequest,
  rejectAgentRequest,
  getAllUsers,
  updateUserRole,
  toggleUserStatus
};
