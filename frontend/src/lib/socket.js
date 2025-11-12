import { io } from 'socket.io-client'
import { API_ROOT } from '@/utils/constants'

let socket = null

export const getSocket = () => socket

export const connectSocket = (accessToken) => {
  if (socket?.connected) {
    console.log('[Socket] Already connected')
    return socket
  }

  console.log('[Socket] Connecting to:', API_ROOT)

  socket = io(API_ROOT, {
    withCredentials: true,
    auth: {
      token: accessToken
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err?.message || err)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  // Debug mode
  if (window.__SOCKET_DEBUG) {
    socket.onAny((event, ...args) => {
      console.log('[Socket Event]', event, args)
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    console.log('[Socket] Disconnecting...')
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

// Join conversation room
export const joinConversation = (conversationId) => {
  if (!socket?.connected) {
    console.warn('[Socket] Not connected, cannot join conversation')
    return
  }
  socket.emit('conversation:join', { conversationId })
}

// Leave conversation room
export const leaveConversation = (conversationId) => {
  if (!socket?.connected) return
  socket.emit('conversation:leave', { conversationId })
}

// Typing indicators
export const emitTypingStart = (conversationId) => {
  if (!socket?.connected) return
  socket.emit('typing:start', { conversationId })
}

export const emitTypingStop = (conversationId) => {
  if (!socket?.connected) return
  socket.emit('typing:stop', { conversationId })
}
