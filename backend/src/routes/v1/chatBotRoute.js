import express from 'express'
import { chatBotController } from '~/controllers/chatBotController';

const Router = express.Router();

Router.post('/', chatBotController.sendMessageToChatBot)

export const chatBotRoutes = Router;