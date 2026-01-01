import { StatusCodes } from 'http-status-codes';
import propertyModel from '~/models/properties';
import userModel from '~/models/users';
import agentRequestModel from '~/models/agentRequests';
import transactionModel from '~/models/transations';
import wishlistModel from '~/models/wishlists';
import userMembershipModel from '~/models/userMembership';
import agentReviewModel from '~/models/agentReviews';
import userActivityModel from '~/models/userActivity';
import ApiError from '~/utils/ApiError';
import { createAndEmitNotification } from '~/services/notificationService';
import { emitNotification } from '~/sockets';

// ===== DASHBOARD STATISTICS =====
const getDashboardStats = async (req, res, next) => {
  try {
    // Parse date range from query (default: last 30 days)
    let startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    let endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    if (isNaN(endDate.getTime())) {
      endDate = new Date();
    }
    
    endDate.setHours(23, 59, 59, 999);

    const dateFilter = { $gte: startDate, $lte: endDate };

    const [
      totalUsers,
      totalAgents,
      totalProperties,
      pendingAgentRequests,
      activeProperties,
      soldProperties,
      totalRevenue,
      topViewedProperties,
      topWishlistedProperties,
      topListingTiers,
      topMemberships,
      topAgentsByRating,
      userTrendData,
      revenueData,
      topSearchedKeywords
    ] = await Promise.all([
      userModel.countDocuments({ role: 'user', isActive: true }),
      userModel.countDocuments({ role: 'agent', isActive: true }),
      propertyModel.countDocuments(),
      agentRequestModel.countDocuments({ status: 'pending' }),
      propertyModel.countDocuments({ status: 'active' }),
      propertyModel.countDocuments({ status: 'sold' }),
      // Total revenue from transactions
      transactionModel.aggregate([
        { $match: { status: 'completed', createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Top 10 most viewed properties - COUNT from userActivity
      (async () => {
        const viewCounts = await userActivityModel.aggregate([
          { $match: { eventType: 'VIEW', propertyId: { $ne: null } } },
          { $group: { _id: '$propertyId', viewCount: { $sum: 1 } } },
          { $sort: { viewCount: -1 } },
          { $limit: 10 },
          { $lookup: { from: 'properties', localField: '_id', foreignField: '_id', as: 'property' } },
          { $unwind: '$property' },
          { $project: { _id: 1, viewCount: 1, title: '$property.title', price: '$property.price', owner: '$property.owner' } },
          { $lookup: { from: 'users', localField: 'owner', foreignField: '_id', as: 'ownerInfo' } },
          { $unwind: { path: '$ownerInfo', preserveNullAndEmptyArrays: true } },
          { $project: { _id: 1, viewCount: 1, title: 1, price: 1, owner: 1, ownerFullName: '$ownerInfo.fullName' } }
        ]);
        return viewCounts.map(item => ({
          _id: item._id,
          title: item.title,
          viewCount: item.viewCount,
          price: item.price,
          owner: { fullName: item.ownerFullName }
        }));
      })(),
      // Top 10 most wishlisted properties
      wishlistModel.aggregate([
        { $unwind: '$properties' },
        { $group: { _id: '$properties', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'properties', localField: '_id', foreignField: '_id', as: 'property' } },
        { $unwind: '$property' },
        { $project: { _id: 1, count: 1, title: '$property.title', price: '$property.price' } }
      ]),
      // Top 5 most purchased listing tiers
      propertyModel.aggregate([
        { $match: { postType: 'vip', createdAt: dateFilter } },
        { $group: { _id: '$postType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Top 5 most purchased memberships
      userMembershipModel.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: '$membershipType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Top 10 agents by rating
      agentReviewModel.aggregate([
        { $match: { _destroy: false } },
        { $group: { _id: '$agent', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
        { $match: { reviewCount: { $gte: 1 } } },
        { $sort: { avgRating: -1, reviewCount: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'agentInfo' } },
        { $unwind: '$agentInfo' },
        { $project: { _id: 1, avgRating: 1, reviewCount: 1, fullName: '$agentInfo.fullName', avatar: '$agentInfo.avatar' } }
      ]),
      // User trend data (daily) for last 30 days - COMBINED with listings and requests
      (async () => {
        const userTrend = await userModel.aggregate([
          { $match: { createdAt: dateFilter } },
          { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }},
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', users: '$count', _id: 0 } }
        ]);

        const propertyTrend = await propertyModel.aggregate([
          { $match: { createdAt: dateFilter } },
          { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }},
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', listings: '$count', _id: 0 } }
        ]);

        const requestTrend = await agentRequestModel.aggregate([
          { $match: { createdAt: dateFilter } },
          { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }},
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', requests: '$count', _id: 0 } }
        ]);

        // Merge all trends by date
        const dateMap = new Map();
        userTrend.forEach(item => {
          if (!dateMap.has(item.date)) dateMap.set(item.date, {});
          dateMap.get(item.date).users = item.users;
        });
        propertyTrend.forEach(item => {
          if (!dateMap.has(item.date)) dateMap.set(item.date, {});
          dateMap.get(item.date).listings = item.listings;
        });
        requestTrend.forEach(item => {
          if (!dateMap.has(item.date)) dateMap.set(item.date, {});
          dateMap.get(item.date).requests = item.requests;
        });

        // Convert to sorted array with all fields
        const merged = Array.from(dateMap.entries())
          .map(([date, data]) => ({
            date,
            users: data.users || 0,
            listings: data.listings || 0,
            requests: data.requests || 0
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        return merged;
      })(),
      // Revenue trend data (daily) for last 30 days
      transactionModel.aggregate([
        { $match: { status: 'completed', createdAt: dateFilter } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' }
        }},
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', revenue: 1, _id: 0 } }
      ]),
      // Top 10 most searched keywords
      userActivityModel.aggregate([
        { $match: { eventType: 'SEARCH', createdAt: dateFilter } },
        { $group: { _id: '$metadata.keyword', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { keyword: '$_id', count: 1, _id: 0 } }
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

    // Get property type distribution
    const propertyTypeData = await propertyModel.aggregate([
      { $group: { _id: '$type', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // Get user type data
    const regularUsers = await userModel.countDocuments({ role: 'user', isActive: true });
    const agents = await userModel.countDocuments({ role: 'agent', isActive: true });
    const userTypeData = [
      { name: 'Regular Users', value: regularUsers },
      { name: 'Agents', value: agents }
    ];

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
      recentAgentRequests,
      userTrendData,
      revenueData,
      propertyTypeData,
      userTypeData,
      topViewedProperties,
      topWishlistedProperties,
      topListingTiers,
      topMemberships,
      topAgentsByRating,
      topSearchedKeywords,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== PROPERTIES MANAGEMENT =====
const getAllProperties = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      type,
      purpose,
      postType,
      minPrice,
      maxPrice,
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (purpose) {
      query.purpose = purpose;
    }

    if (postType) {
      query.postType = postType;
    }

    if (minPrice || maxPrice) {
      query['price.value'] = {};
      if (minPrice) query['price.value'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.value'].$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'address.fullAddress': { $regex: search, $options: 'i' } },
        { 'address.province': { $regex: search, $options: 'i' } }
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

// ===== TRANSACTION STATS =====
const getTransactionStats = async (req, res, next) => {
  try {
    let startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    let endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    if (isNaN(endDate.getTime())) {
      endDate = new Date();
    }
    
    endDate.setHours(23, 59, 59, 999);

    const dateFilter = { $gte: startDate, $lte: endDate };

    const [
      totalTransactions,
      completedTransactions,
      totalRevenue,
      revenueByDateData,
      transactionByTypeData,
      transactionByPaymentMethodData,
      transactionByStatusData,
      topSpenders,
      recentTransactions
    ] = await Promise.all([
      // Total transactions count
      transactionModel.countDocuments({ createdAt: dateFilter }),
      
      // Completed transactions count
      transactionModel.countDocuments({ status: 'completed', createdAt: dateFilter }),
      
      // Total revenue from completed transactions
      transactionModel.aggregate([
        { $match: { status: 'completed', createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Revenue by date
      transactionModel.aggregate([
        { $match: { status: 'completed', createdAt: dateFilter } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' }
        }},
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', revenue: 1, _id: 0 } }
      ]),
      
      // Transactions by type
      transactionModel.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: '$type', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]),
      
      // Transactions by payment method
      transactionModel.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: '$paymentMethod', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]),
      
      // Transactions by status
      transactionModel.aggregate([
        { $match: { createdAt: dateFilter } },
        { $group: { _id: '$status', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]),
      
      // Top 10 spenders
      transactionModel.aggregate([
        { $match: { status: 'completed', createdAt: dateFilter } },
        { $group: {
          _id: '$user',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: '$createdAt' }
        }},
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }},
        { $unwind: '$userInfo' },
        { $project: {
          _id: 1,
          totalSpent: 1,
          transactionCount: 1,
          lastTransaction: 1,
          averageSpent: { $divide: ['$totalSpent', '$transactionCount'] },
          fullName: '$userInfo.fullName',
          email: '$userInfo.email',
          avatar: '$userInfo.avatar',
          role: '$userInfo.role'
        }}
      ]),

      // Recent transactions (all transactions in date range, sorted by date)
      transactionModel.find({ createdAt: dateFilter })
        .populate('user', 'fullName email avatar role')
        .sort({ createdAt: -1 })
        .lean()
    ]);
    

    const averageTransactionValue = completedTransactions > 0 
      ? (totalRevenue[0]?.total || 0) / completedTransactions 
      : 0;
    
    const successRate = totalTransactions > 0 
      ? (completedTransactions / totalTransactions) * 100 
      : 0;

    res.status(StatusCodes.OK).json({
      stats: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalTransactions,
        completedTransactions,
        averageTransactionValue,
        successRate
      },
      revenueByDateData,
      transactionByTypeData,
      transactionByPaymentMethodData,
      transactionByStatusData,
      topSpenders,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

const getPropertyStats = async (req, res, next) => {
  try {
    const [
      totalProperties,
      totalPropertyTypes,
      topViewedProperties,
      propertiesByCity
    ] = await Promise.all([
      // Tổng số BDS
      propertyModel.countDocuments(),
      
      // Tổng số loại BDS
      propertyModel.distinct('type').then(types => types.length),
      
      // Top 10 căn hộ được xem nhiều nhất
      userActivityModel.aggregate([
        { $match: { eventType: 'VIEW', propertyId: { $ne: null } } },
        { $group: { _id: '$propertyId', viewCount: { $sum: 1 } } },
        { $sort: { viewCount: -1 } },
        { $limit: 10 },
        { 
          $lookup: { 
            from: 'properties', 
            localField: '_id', 
            foreignField: '_id', 
            as: 'property' 
          } 
        },
        { $unwind: '$property' },
        { 
          $lookup: { 
            from: 'users', 
            localField: 'property.owner', 
            foreignField: '_id', 
            as: 'ownerInfo' 
          } 
        },
        { $unwind: { path: '$ownerInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            viewCount: 1,
            title: '$property.title',
            price: '$property.price',
            type: '$property.type',
            address: '$property.address',
            media: { $arrayElemAt: ['$property.media', 0] },
            owner: {
              _id: '$ownerInfo._id',
              fullName: '$ownerInfo.fullName',
              avatar: '$ownerInfo.avatar'
            }
          }
        }
      ]),
      
      // Số căn hộ theo thành phố (province)
      propertyModel.aggregate([
        {
          $match: {
            'address.province': { $exists: true, $ne: null, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$address.province',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $project: {
            _id: 0,
            city: '$_id',
            count: 1
          }
        }
      ])
    ]);

    res.status(StatusCodes.OK).json({
      totalProperties,
      totalPropertyTypes,
      topViewedProperties,
      propertiesByCity
    });
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRegularUsers,
      totalAgents,
      totalAdmins,
      activeUsers,
      inactiveUsers,
      topAgentsByProperties,
      topUsersByActivity,
      usersByProvince,
      userGrowthData,
      recentUsers
    ] = await Promise.all([
      // Tổng số người dùng
      userModel.countDocuments(),
      
      // Tổng số user thường
      userModel.countDocuments({ role: 'user' }),
      
      // Tổng số agent
      userModel.countDocuments({ role: 'agent' }),
      
      // Tổng số admin
      userModel.countDocuments({ role: 'admin' }),
      
      // Người dùng đang hoạt động
      userModel.countDocuments({ isActive: true }),
      
      // Người dùng không hoạt động
      userModel.countDocuments({ isActive: false }),
      
      // Top 10 agents theo số lượng BDS
      propertyModel.aggregate([
        {
          $group: {
            _id: '$owner',
            propertyCount: { $sum: 1 }
          }
        },
        { $sort: { propertyCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        { $match: { 'userInfo.role': 'agent' } },
        {
          $project: {
            _id: 1,
            propertyCount: 1,
            fullName: '$userInfo.fullName',
            email: '$userInfo.email',
            avatar: '$userInfo.avatar',
            companyName: '$userInfo.companyName'
          }
        }
      ]),
      
      // Top 10 users theo hoạt động (views, searches)
      userActivityModel.aggregate([
        { $match: { userId: { $ne: null } } },
        {
          $group: {
            _id: '$userId',
            activityCount: { $sum: 1 }
          }
        },
        { $sort: { activityCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $project: {
            _id: 1,
            activityCount: 1,
            fullName: '$userInfo.fullName',
            email: '$userInfo.email',
            avatar: '$userInfo.avatar',
            role: '$userInfo.role'
          }
        }
      ]),
      
      // Phân bố users theo tỉnh/thành phố
      userModel.aggregate([
        {
          $match: {
            'address.province': { $exists: true, $ne: null, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$address.province',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
        {
          $project: {
            _id: 0,
            city: '$_id',
            count: 1
          }
        }
      ]),
      
      // User growth data (last 30 days)
      (async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const userGrowth = await userModel.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                role: '$role'
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.date': 1 } }
        ]);

        // Organize by date with role breakdown
        const dateMap = new Map();
        userGrowth.forEach(item => {
          const date = item._id.date;
          if (!dateMap.has(date)) {
            dateMap.set(date, { date, users: 0, agents: 0, admins: 0 });
          }
          const entry = dateMap.get(date);
          if (item._id.role === 'user') entry.users = item.count;
          if (item._id.role === 'agent') entry.agents = item.count;
          if (item._id.role === 'admin') entry.admins = item.count;
        });

        return Array.from(dateMap.values()).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
      })(),
      
      // Recent users (last 10)
      userModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('-password -verifyToken')
        .lean()
    ]);

    // User role distribution
    const userRoleDistribution = [
      { name: 'Users', value: totalRegularUsers },
      { name: 'Agents', value: totalAgents },
      { name: 'Admins', value: totalAdmins }
    ];

    // User status distribution
    const userStatusDistribution = [
      { name: 'Active', value: activeUsers },
      { name: 'Inactive', value: inactiveUsers }
    ];

    res.status(StatusCodes.OK).json({
      totalUsers,
      totalRegularUsers,
      totalAgents,
      totalAdmins,
      activeUsers,
      inactiveUsers,
      userRoleDistribution,
      userStatusDistribution,
      topAgentsByProperties,
      topUsersByActivity,
      usersByProvince,
      userGrowthData,
      recentUsers
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
  toggleUserStatus,
  getTransactionStats,
  getPropertyStats,
  getUserStats
};
