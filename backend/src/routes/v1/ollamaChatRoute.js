import express from 'express'
import fetch from 'node-fetch'
console.log('[ollamaChatRoute] loaded')

import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'

export const ollamaChatRoutes = express.Router()

// Health check
ollamaChatRoutes.get('/', (_req, res) => {
  res.json({ ok: true, route: 'POST /api/ollama-chat' })
})

// Gọi Ollama để generate text
ollamaChatRoutes.post('/', async (req, res) => {
  try {
    const { input } = req.body || {}
    if (!input) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Missing "input" in request body' })
    }

    // Gọi Ollama API
    const response = await fetch(`${env.OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,  // model bạn đã pull
        prompt: String(input),
        stream: false                    // false = trả về một lần, không streaming
      })
    })

    const raw = await response.text()
    if (!response.ok) {
      console.error('Ollama error:', response.status, raw)
      return res.status(response.status).json({ error: raw })
    }

    const data = JSON.parse(raw)
    // Ollama trả kết quả chính trong field `response`
    return res.json({ output: data.response })
  } catch (err) {
    console.error('ollamaChat error:', err)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: String(err) })
  }
})
