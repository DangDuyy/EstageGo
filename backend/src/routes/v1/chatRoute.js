import express from 'express'
import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { StatusCodes } from 'http-status-codes'

const Router = express.Router()

// Minimal POST handler following the docs: accept UIMessage[] and stream UI response
Router.post('/', async (req, res) => {
  try {
    const { messages } = req.body || {}

    if (!messages) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Missing messages in request body' })
    }

    const modelMessages = convertToModelMessages(messages)

    const result = streamText({
      model: openai('gpt-4o'),
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    console.error('Chat route error:', err)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: String(err) })
  }
})

export const chatRoutes = Router
