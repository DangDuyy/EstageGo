import express from 'express'
import { paymentController } from '~/controllers/paymentController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.post('/create', authMiddleware.isAuthorized, paymentController.createPayment)
Router.get('/transactions', authMiddleware.isAuthorized, paymentController.getTransactionHistory)
Router.get('/transactions/:transactionId', authMiddleware.isAuthorized, paymentController.getTransactionDetail)
Router.get('/balance', authMiddleware.isAuthorized, paymentController.getBalance)

// Public route (VNPay callback - no auth required)
Router.get('/vnpay-return', paymentController.vnpayReturn)

// Get bank list
Router.get('/banks', authMiddleware.isAuthorized, paymentController.getBankList)

export const paymentRoute = Router