import express from 'express';
import { adminController } from '~/controllers/adminController';
import { requireAdmin } from '~/middlewares/adminMiddleware';
import { authMiddleware } from '~/middlewares/authMiddleware';

const Router = express.Router();

// Tất cả routes admin đều yêu cầu authentication và admin role
Router.use(authMiddleware.isAuthorized);
Router.use(requireAdmin);

// Dashboard
Router.get('/dashboard/stats', adminController.getDashboardStats);

// Properties Management
Router.get('/properties', adminController.getAllProperties);
Router.patch('/properties/:propertyId/status', adminController.updatePropertyStatus);
Router.delete('/properties/:propertyId', adminController.deleteProperty);

// Agent Requests Management
Router.get('/agent-requests', adminController.getAgentRequests);
Router.patch('/agent-requests/:requestId/approve', adminController.approveAgentRequest);
Router.patch('/agent-requests/:requestId/reject', adminController.rejectAgentRequest);

// Users Management
Router.get('/users', adminController.getAllUsers);
Router.patch('/users/:userId/role', adminController.updateUserRole);
Router.patch('/users/:userId/toggle-status', adminController.toggleUserStatus);

export const adminRoutes = Router;
