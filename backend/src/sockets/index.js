import { Server } from 'socket.io'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

// ===== Notification helpers (non-breaking) =====
let ioInstance = null

// Emit a generic event to a specific user's personal room
export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return
  ioInstance.to(`user:${userId}`).emit(event, payload)
}

// Emit a notification to a specific user (standardized event name)
export const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification:new', notification)
}

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    const decoded = await JwtProvider.verifyToken(
      token,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )
    socket.user = { id: decoded._id, email: decoded.email }
    next()
  } catch (error) {
    next(new Error('Authentication error: Invalid token'))
  }
}

// Register chat + notification events
const registerChatEvents = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user?.id
    console.log(`[Socket] User connected: ${userId}`)

    if (userId) {
      // Join user's personal room
      socket.join(`user:${userId}`)
    }

    // ===== Chat rooms & typing (existing) =====
    socket.on('conversation:join', ({ conversationId }) => {
      if (!conversationId) return
      socket.join(`conversation:${conversationId}`)
      console.log(`[Socket] User ${userId} joined conversation: ${conversationId}`)
    })

    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId) return
      socket.leave(`conversation:${conversationId}`)
      console.log(`[Socket] User ${userId} left conversation: ${conversationId}`)
    })

    socket.on('typing:start', ({ conversationId }) => {
      if (!conversationId) return
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId
      })
    })

    socket.on('typing:stop', ({ conversationId }) => {
      if (!conversationId) return
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId
      })
    })

    // ===== Notifications (optional client-driven actions) =====
    // Client can ask server to ping unread count, or other simple actions if needed.
    socket.on('notifications:ping', () => {
      // Keep it lightweight; you can emit a server-side computed count here if you track it.
      socket.emit('notifications:pong', { ok: true, ts: Date.now() })
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`)
    })
  })
}

// Initialize Socket.IO
export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.WEBSITE_DOMAIN_DEVELOPMENT || 'http://localhost:5173',
      credentials: true
    }
  })

  // Apply authentication middleware
  io.use(socketAuth)

  // Register event handlers
  registerChatEvents(io)

  // Save instance for helpers
  ioInstance = io

  return io
}
