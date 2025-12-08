import { StatusCodes } from "http-status-codes"
import { messageService } from "~/services/messageService"
import { createAndEmitNotification } from '~/services/notificationService'

const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.jwtDecoded._id
    const { conversationId, text } = req.body
    const io = req.io

    if (!conversationId || !text) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: 'conversationId and text are required' 
      })
    }

    const { message, conversation } = await messageService.sendMessage({
      conversationId,
      senderId,
      text,
      io
    })

    // Notify all other participants in the conversation
    const recipients = (conversation?.participants || []).filter(
      (id) => String(id) !== String(senderId)
    )

    if (recipients.length > 0) {
      await Promise.all(
        recipients.map((recipientId) =>
          createAndEmitNotification(String(recipientId), {
            type: 'MESSAGE',
            title: 'New message',
            message: `${req.user?.fullName || 'Someone'} sent you a message`,
            meta: { conversationId: message.conversationId, messageId: message._id }
          })
        )
      )
    }

    res.status(StatusCodes.CREATED).json(message)
  } catch (error) {
    next(error)
  }
}

const getMessages = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query

    const result = await messageService.getMessages({
      conversationId,
      userId,
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const messageController = {
  sendMessage,
  getMessages
}
