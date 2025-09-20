import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoutes } from './userRoute'
import {propertyRoutes} from './propertyRoute'
import { chatRoutes } from './chatRoute'

const Router = express.Router()

Router.get('/status', (req,res) => {
  res.status(StatusCodes.OK).json({message: 'APIs V1 are ready to use. ', code: StatusCodes.OK})
})

Router.use('/users', userRoutes)

Router.use('/properties', propertyRoutes)

Router.use('/chat', chatRoutes)

export const APIs_V1 = Router