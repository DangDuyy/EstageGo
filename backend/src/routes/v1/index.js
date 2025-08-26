import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoutes } from './userRoute'

const Router = express.Router()

Router.get('/status', (req,res) => {
  res.status(StatusCodes.OK).json({message: 'APIs V1 are ready to use. ', code: StatusCodes.OK})
})

Router.use('/users', userRoutes)

export const APIs_V1 = Router