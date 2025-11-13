import express from 'express';
import { agentRequestController } from '~/controllers/agentRequestController';
import { authMiddleware } from '~/middlewares/authMiddleware';

const Router = express.Router();

// Tất cả routes yêu cầu authentication
Router.use(authMiddleware.isAuthorized);

// User routes
Router.post('/', agentRequestController.createAgentRequest);
Router.get('/my-request', agentRequestController.getMyAgentRequest);
Router.delete('/my-request', agentRequestController.cancelAgentRequest);

export const agentRequestRoutes = Router;
