"use client"

import { useState } from "react"
import { useChat } from '@ai-sdk/react';

import { Chat } from "@/components/ui/chat"

export function ChatBot() {
  // useChat provides the chat state and a sendMessage method.
  // It does NOT provide input/handleInputChange/handleSubmit — manage input locally
  const { messages, sendMessage, status, stop, setMessages } = useChat()

  const [input, setInput] = useState("")

  const handleInputChange = (e) => setInput(e.target.value)

  // ChatForm may call handleSubmit(event) or handleSubmit(event, { experimental_attachments })
  const handleSubmit = (event, options) => {
    event?.preventDefault?.()
    if (!input && !(options && options.experimental_attachments)) return

    // sendMessage expects an object like { text: string }
    // forward experimental attachments (if any) under the same key so the SDK can handle them
    const payload = {
      text: input,
      ...(options?.experimental_attachments ? { experimental_attachments: options.experimental_attachments } : {}),
    }

    // call the SDK
    try {
      sendMessage(payload)
    } catch (err) {
      // swallow here - SDK surfaces errors on the chat state
      console.error("sendMessage error:", err)
    }

    // clear the input after sending
    setInput("")
  }

  const isLoading = status === "submitted" || status === "streaming"

  return (
    <Chat
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isGenerating={isLoading}
      stop={stop}
      setMessages={setMessages}
    />
  )
}