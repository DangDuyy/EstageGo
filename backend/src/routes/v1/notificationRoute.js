import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { notificationController } from '~/controllers/notificationController'

const Router = express.Router()

Router.use(authMiddleware.isAuthorized)

Router.get('/', notificationController.getMyNotifications)
Router.patch('/:id/read', notificationController.markRead)
Router.patch('/read-all', notificationController.markAllRead)

export const notificationRoutes = Router