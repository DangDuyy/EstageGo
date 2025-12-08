import { io } from 'socket.io-client'
import { API_ROOT } from '@/utils/constants'

let socket = null
let notificationHandlers = []
let notificationDispatch = null

// Subscribe notification events using existing socket (same as chat)
export const onNotification = (handler) => {
  // Register locally; socket listener (notificationDispatch) calls all handlers
  notificationHandlers.push(handler)
  return () => {
    notificationHandlers = notificationHandlers.filter(h => h !== handler)
  }
}

export const getSocket = () => socket

export const updateSocketToken = (newAccessToken) => {
  if (!socket) return
  // Just update token; let next reconnect use it
  socket.auth = { token: newAccessToken }
}

export const connectSocket = (accessToken) => {
  // Reuse the singleton even if not connected yet
  if (socket) {
    if (!socket.connected) {
      // ensure single listener
      socket.off('notification:new')
      if (!notificationDispatch) {
        notificationDispatch = (payload) => {
          notificationHandlers.forEach(fn => {
            try { fn(payload) } catch (e) { console.error('[Socket] notification handler error', e) }
          })
        }
      }
      socket.on('notification:new', notificationDispatch)
      // eslint-disable-next-line no-empty
      try { socket.connect() } catch {}
    }
    return socket
  }

  console.log('[Socket] Connecting to:', API_ROOT)
  socket = io(API_ROOT.replace('/api', ''), {
    withCredentials: true,
    auth: { token: accessToken },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500
  })

  // One dispatcher only
  if (!notificationDispatch) {
    notificationDispatch = (payload) => {
      notificationHandlers.forEach(fn => {
        try { fn(payload) } catch (e) { console.error('[Socket] notification handler error', e) }
      })
    }
  }
  socket.off('notification:new')
  socket.on('notification:new', notificationDispatch)

  socket.on('connect', () => console.log('[Socket] Connected:', socket.id))
  socket.on('connect_error', (err) => console.error('[Socket] Connection error:', err?.message || err))
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason))

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    if (notificationDispatch) socket.off('notification:new', notificationDispatch)
    socket.close()
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
