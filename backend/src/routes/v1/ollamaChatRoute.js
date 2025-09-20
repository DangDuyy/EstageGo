import express from 'express'
import fetch from 'node-fetch'
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'

export const ollamaChatRoutes = express.Router()

ollamaChatRoutes.get('/', (_req, res) => {
  res.json({ ok: true, route: 'POST /api/ollama-chat' })
})

ollamaChatRoutes.post('/', async (req, res) => {
  try {
    const { input } = req.body || {}
    if (!input) return res.status(400).json({ error: 'Missing "input"' })

    const r = await fetch(`${env.OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: String(input),
        stream: true,
        keep_alive: '5m',
        options: { num_predict: -1}
      })
    })
    if (!r.ok) return res.status(r.status).send(await r.text())

    const body = r.body
    let full = ''

    // Web ReadableStream (Node 18+ fetch / node-fetch v3)
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        // NDJSON: tách theo newline
        let idx
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim()
          buf = buf.slice(idx + 1)
          if (!line) continue
          try {
            const obj = JSON.parse(line)
            if (obj.response) full += obj.response
            if (obj.done) {
              return res.json({ output: full, usage: { eval: obj.eval_count, prompt: obj.prompt_eval_count } })
            }
          } catch {}
        }
      }
      // fallback nếu không thấy done
      return res.json({ output: full })
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
            if (obj.done) {
              res.json({ output: full, usage: { eval: obj.eval_count, prompt: obj.prompt_eval_count } })
            }
          } catch {}
        }
      })
      body.on('end', () => {
        if (!res.headersSent) res.json({ output: full })
      })
      body.on('error', err => {
        if (!res.headersSent) res.status(500).json({ error: String(err) })
      })
      return
    }

    // fallback
    const txt = await r.text()
    res.send(txt)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

