import { useState, useEffect, useCallback } from 'react'
import { getSocket } from '@/lib/socket'
import { getConversationsAPI, createOrGetConversationAPI } from '@/apis'
import { toast } from 'react-toastify'

export const useConversations = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getConversationsAPI()
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create or get conversation with user
  const createConversation = useCallback(async (otherUserId) => {
    try {
      const conversation = await createOrGetConversationAPI(otherUserId)
      
      // Add to list if not exists
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conversation._id)
        if (exists) return prev
        return [conversation, ...prev]
      })

      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Failed to create conversation')
      throw error
    }
  }, [])

  // Update conversation when new message arrives
  const updateConversationLastMessage = useCallback((conversationId, message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              messageId: message._id,
              text: message.text,
              senderId: message.senderId,
              createdAt: message.createdAt
            },
            updatedAt: new Date()
          }
        }
        return conv
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    )
  }, [])

  // Setup socket listeners
  useEffect(() => {
    const socket = getSocket()
    if (!socket?.connected) return

    const handleNewMessage = ({ conversationId, message }) => {
      updateConversationLastMessage(conversationId, message)
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('message:new', handleNewMessage)
    }
  }, [updateConversationLastMessage])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    loading,
    loadConversations,
    createConversation
  }
}
