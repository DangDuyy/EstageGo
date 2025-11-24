import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { propertyRoutes } from './propertyRoute'
import { userRoutes } from './userRoute'
import { ollamaChatRoutes } from './ollamaChatRoute'
import { wishlistRoute } from './wishlistRoute'
import { conversationRoutes } from './conversationRoute'
import { messageRoutes } from './messageRoute'
import { adminRoutes } from './adminRoute'
import { agentRequestRoutes } from './agentRequestRoute'
import { recommendationRoutes } from './recommendationRoute'
import { vapiRoutes } from './vapiRoute'
import { chatBotRoutes } from './chatBotRoute'
import { paymentRoute } from './paymentRoute'

const Router = express.Router()

Router.get('/status', (req,res) => {
  res.status(StatusCodes.OK).json({message: 'APIs V1 are ready to use. ', code: StatusCodes.OK})
})

Router.use('/users', userRoutes)

Router.use('/properties', propertyRoutes)

Router.use('/ollama-chat', ollamaChatRoutes)

Router.use('/vapi', vapiRoutes)

Router.use('/wishlist', wishlistRoute)

Router.use('/conversations', conversationRoutes)

Router.use('/messages', messageRoutes)

Router.use('/admin', adminRoutes)

Router.use('/agent-requests', agentRequestRoutes)

Router.use('/recommendations', recommendationRoutes)

Router.use('/chatbot', chatBotRoutes)

Router.use('/payment', paymentRoute)

export const APIs_V1 = Router