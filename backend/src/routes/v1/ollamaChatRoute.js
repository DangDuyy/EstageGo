import express from 'express'
import fetch from 'node-fetch'
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'

export const ollamaChatRoutes = express.Router()

ollamaChatRoutes.get('/', (_req, res) => {
  res.json({ ok: true, route: 'POST /api/ollama-chat' })
})

const SYSTEM_PROMPT = `
Bạn là chuyên gia bất động sản tại Việt Nam, có nhiều năm kinh nghiệm.
Nguyên tắc trả lời:
- Súc tích, dễ hiểu, có gạch đầu dòng khi cần.
- Tư vấn thực tế: vị trí, tiện ích, ngân sách, pháp lý, thanh khoản, rủi ro.
- Không bịa số liệu; nếu thiếu dữ liệu, nói rõ giả định.
`.trim()

const GREETING = 'Chào bạn, tôi là một chuyên gia trong lĩnh vực bất động sản nhiều năm ở Việt Nam, bạn cần hỗ trợ gì không ?\n\n'


ollamaChatRoutes.post('/', async (req, res) => {
  try {
    const { input } = req.body || {}

    // ✅ Nếu chưa nhập input → trả lời chào sẵn
    if (!input) {
      return res
        .type('text/plain; charset=utf-8')
        .send('Chào bạn, tôi là một chuyên gia trong lĩnh vực bất động sản nhiều năm ở Việt Nam, bạn cần hỗ trợ gì không ?')
    }

    const r = await fetch(`${env.OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: String(input),
        system: SYSTEM_PROMPT,
        stream: true,
        keep_alive: '10m',
        options: { num_predict: -1 }
      })
    })
    if (!r.ok) {
      const raw = await r.text()
      return res.status(r.status).type('text/plain; charset=utf-8').send(raw)
    }

    let full = ''
    const body = r.body

    // Web ReadableStream (Node 18+ / undici / node-fetch v3)
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let idx
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim()
          buf = buf.slice(idx + 1)
          if (!line) continue
          try {
            const obj = JSON.parse(line)
            if (obj.response) full += obj.response
            if (obj.done) {
              return res.type('text/plain; charset=utf-8').send(GREETING + full.trim())
            }
          } catch {}
        }
      }
      return res.type('text/plain; charset=utf-8').send(full.trim())
    }

    // Node Readable stream (node-fetch v2)
    if (body && typeof body.on === 'function') {
      let buf = ''
      body.on('data', chunk => {
        buf += chunk.toString()
        let idx
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim()
          buf = buf.slice(idx + 1)
          if (!line) continue
          try {
            const obj = JSON.parse(line)
            if (obj.response) full += obj.response
            if (obj.done && !res.headersSent) {
              res.type('text/plain; charset=utf-8').send(full.trim())
            }
          } catch {}
        }
      })
      body.on('end', () => {
        if (!res.headersSent) res.type('text/plain; charset=utf-8').send(full.trim())
      })
      body.on('error', err => {
        if (!res.headersSent) res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(String(err))
      })
      return
    }

    // Fallback
    const txt = await r.text()
    res.type('text/plain; charset=utf-8').send(txt)
  } catch (e) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(String(e))
  }
})
