import { useState, useEffect, useCallback } from 'react'
import { getSocket, joinConversation, leaveConversation } from '@/lib/socket'
import { getMessagesAPI, sendMessageAPI } from '@/apis'
import { toast } from 'react-toastify'

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0
  })
  const [recalledMap, setRecalledMap] = useState({})

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      const data = await getMessagesAPI(conversationId, 1, 50)
      setMessages(data.messages || [])
      setPagination({
        page: 1,
        hasMore: data.pagination.page < data.pagination.totalPages,
        total: data.pagination.total
      })
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Load more older messages
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || loadingMore || !pagination.hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = pagination.page + 1
      const data = await getMessagesAPI(conversationId, nextPage, 50)
      
      // Prepend older messages to the beginning
      setMessages((prev) => [...data.messages, ...prev])
      setPagination({
        page: nextPage,
        hasMore: data.pagination.page < data.pagination.totalPages,
        total: data.pagination.total
      })
    } catch (error) {
      console.error('Error loading more messages:', error)
      toast.error('Failed to load more messages')
    } finally {
      setLoadingMore(false)
    }
  }, [conversationId, pagination.page, pagination.hasMore, loadingMore])

  // Send message: supports text-only or text + files
  const sendMessage = useCallback(async ({ text = '', files = [] } = {}) => {
    if (!conversationId) return
    const trimmed = (text || '').trim()
    const hasText = !!trimmed
    const hasFiles = Array.isArray(files) && files.length > 0
    if (!hasText && !hasFiles) return

    try {
      setSending(true)

      if (hasFiles) {
        const payload = { text: trimmed, files }
        const message = await sendMessageAPI(conversationId, payload, true)
        return message
      }

      const message = await sendMessageAPI(conversationId, trimmed)
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
    if (!conversationId) {
      return
    }

    const socket = getSocket()
    if (!socket) {
      console.warn('[useChat] Socket not initialized')
      return
    }

    let cleanupFn = null

    // Setup listeners function
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

      // Listen for reactions update
      const handleReactionUpdate = ({ messageId, reactions, conversationId: msgConvId }) => {
        if (msgConvId !== conversationId) return
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId)
              ? { ...m, reactions }
              : m
          )
        )
      }

      const handleRecalled = ({ messageId, conversationId: msgConvId }) => {
        if (msgConvId !== conversationId) return
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id) === String(messageId)
              ? { ...m, recalled: true }
              : m
          )
        )
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
      socket.on('message:reaction', handleReactionUpdate)
      socket.on('message:recalled', handleRecalled)

      // Return cleanup function
      cleanupFn = () => {
        socket.off('message:new', handleNewMessage)
        socket.off('typing:start', handleTypingStart)
        socket.off('typing:stop', handleTypingStop)
        socket.off('message:reaction', handleReactionUpdate)
        socket.off('message:recalled', handleRecalled)
        leaveConversation(conversationId)
      }
    }

    if (socket.connected) {
      setupListeners()
    } else {
      // Wait for connection
      const onConnect = () => {
        setupListeners()
      }
      socket.once('connect', onConnect)

      cleanupFn = () => {
        socket.off('connect', onConnect)
      }
    }

    // Cleanup on unmount or conversationId change
    return () => {
      if (cleanupFn) cleanupFn()
    }
  }, [conversationId])

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    loading,
    loadingMore,
    sending,
    typingUsers,
    pagination,
    sendMessage,
    loadMessages,
    loadMoreMessages
  }
}
