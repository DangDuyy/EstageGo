"use client"

import { useState } from "react"
import { Chat } from "@/components/ui/chat"
import { sendOllamaMessage } from '@/apis/ollama'

// Feature toggle: when VITE_USE_OLLAMA === 'true' the component will
// send messages to the local /api/ollama-chat endpoint using our helper.
const USE_OLLAMA = import.meta.env.VITE_USE_OLLAMA === 'true'

export function ChatBot() {
  const [input, setInput] = useState("")
  // local state for Ollama flow
  const [messagesLocal, setMessagesLocal] = useState([])
  const [statusLocal, setStatusLocal] = useState('idle')

  const handleInputChange = (e) => setInput(e.target.value)

  // Ollama flow (managed locally)
  const handleSubmit = async (event, options) => {
    event?.preventDefault?.()
    if (!input && !(options && options.experimental_attachments)) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessagesLocal((m) => [...m, userMessage])
    setInput("")

    setStatusLocal('submitted')
    try {
      const payload = { text: userMessage.content }
      const data = await sendOllamaMessage(payload)

      const assistantText = data?.text || data?.response || data?.message || JSON.stringify(data)

      const assistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
      }

      setMessagesLocal((m) => [...m, assistantMessage])
    } catch (err) {
      console.error('Ollama chat error:', err)
      const errorMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I could not reach the chat service. Please try again later.',
      }
      setMessagesLocal((m) => [...m, errorMessage])
    } finally {
      setStatusLocal('idle')
    }
  }

  const isLoading = statusLocal === 'submitted' || statusLocal === 'streaming'

  // stop is a no-op for the simple Ollama flow
  const stop = () => {}

  return (
    <Chat
      messages={messagesLocal}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isGenerating={isLoading}
      stop={stop}
      setMessages={setMessagesLocal}
    />
  )
}