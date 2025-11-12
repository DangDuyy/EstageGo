import { useState, useEffect, useCallback } from 'react'
import { getSocket, joinConversation, leaveConversation } from '@/lib/socket'
import { getMessagesAPI, sendMessageAPI } from '@/apis'
import { toast } from 'react-toastify'

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      const data = await getMessagesAPI(conversationId)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Send message
  const sendMessage = useCallback(async (text) => {
    if (!conversationId || !text.trim()) return

    try {
      setSending(true)
      const message = await sendMessageAPI(conversationId, text.trim())
      // Message will be added via socket event
      return message
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }, [conversationId])

  // Setup socket listeners
  useEffect(() => {
    if (!conversationId) return

    const socket = getSocket()
    if (!socket) {
      console.warn('[useChat] Socket not initialized')
      return
    }

    // Wait for socket to connect if not connected yet
    const setupListeners = () => {
      // Join conversation room
      joinConversation(conversationId)

      // Listen for new messages
      const handleNewMessage = ({ message, conversationId: msgConvId }) => {
        // Only add message if it's for this conversation
        if (msgConvId === conversationId) {
          setMessages((prev) => {
            // Prevent duplicate messages
            const exists = prev.find((m) => m._id === message._id)
            if (exists) return prev
            return [...prev, message]
          })
        }
      }

      // Listen for typing indicators
      const handleTypingStart = ({ userId, conversationId: typingConvId }) => {
        if (typingConvId === conversationId) {
          setTypingUsers((prev) => [...new Set([...prev, userId])])
        }
      }

      const handleTypingStop = ({ userId, conversationId: typingConvId }) => {
        if (typingConvId === conversationId) {
          setTypingUsers((prev) => prev.filter((id) => id !== userId))
        }
      }

      socket.on('message:new', handleNewMessage)
      socket.on('typing:start', handleTypingStart)
      socket.on('typing:stop', handleTypingStop)

      return () => {
        socket.off('message:new', handleNewMessage)
        socket.off('typing:start', handleTypingStart)
        socket.off('typing:stop', handleTypingStop)
        leaveConversation(conversationId)
      }
    }

    if (socket.connected) {
      return setupListeners()
    } else {
      // Wait for connection
      const onConnect = () => {
        console.log('[useChat] Socket connected, setting up listeners')
        setupListeners()
      }
      socket.once('connect', onConnect)

      return () => {
        socket.off('connect', onConnect)
      }
    }
  }, [conversationId])

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    loading,
    sending,
    typingUsers,
    sendMessage,
    loadMessages
  }
}
