import { Server } from 'socket.io'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import { registerPresence } from './presence'
import { userService } from '~/services/userService'

// ===== Notification helpers (non-breaking) =====
let ioInstance = null

// Track which users are viewing which conversations
// Map<conversationId, Set<userId>>
const activeConversations = new Map()

// Check if a user is currently viewing a conversation
export const isUserViewingConversation = (userId, conversationId) => {
  const viewers = activeConversations.get(String(conversationId))
  return viewers ? viewers.has(String(userId)) : false
}

// Emit a generic event to a specific user's personal room
export const emitToUser = (userId, event, payload) => {
  if (!ioInstance) {
    console.error(`[Socket] ioInstance is null, cannot emit ${event} to user ${userId}`)
    return
  }
  if (!userId) {
    console.error(`[Socket] userId is null, cannot emit ${event}`)
    return
  }
  
  const uid = String(userId)
  const room = `user:${uid}`
  
  console.log(`[Socket] Emitting ${event} to room ${room}`)
  console.log(`[Socket] Payload:`, payload)
  
  // Get room members for debugging
  const roomMembers = ioInstance.sockets.adapter.rooms.get(room)
  console.log(`[Socket] Room ${room} has ${roomMembers?.size || 0} member(s)`)
  
  ioInstance.to(room).emit(event, payload)
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
    if (userId) {
      const room = `user:${String(userId)}`
      socket.join(room)
      console.log(`[Socket] Connected: User ${userId} joined room: ${room}`)
    } else {
      console.log(`[Socket] Connected but no userId found in auth`)
    }

    // ===== User explicitly joins their room (for reconnection) =====
    socket.on('user:join', ({ userId: explicitUserId }) => {
      const uid = explicitUserId || socket.user?.id
      if (uid) {
        const room = `user:${String(uid)}`
        socket.join(room)
        console.log(`[Socket] User ${uid} explicitly joined room: ${room}`)
      }
    })

    // ===== Chat rooms & typing (existing) =====
    socket.on('conversation:join', ({ conversationId }) => {
      if (!conversationId) return
      socket.join(`conversation:${conversationId}`)
      console.log(`[Socket] User ${userId} joined conversation: ${conversationId}`)
      
      // Track that this user is viewing this conversation
      const convId = String(conversationId)
      if (!activeConversations.has(convId)) {
        activeConversations.set(convId, new Set())
      }
      activeConversations.get(convId).add(String(userId))
    })

    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId) return
      socket.leave(`conversation:${conversationId}`)
      console.log(`[Socket] User ${userId} left conversation: ${conversationId}`)
      
      // Remove user from active viewers
      const convId = String(conversationId)
      const viewers = activeConversations.get(convId)
      if (viewers) {
        viewers.delete(String(userId))
        if (viewers.size === 0) {
          activeConversations.delete(convId)
        }
      }
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
      
      // Clean up all active conversations for this user
      if (userId) {
        const uid = String(userId)
        activeConversations.forEach((viewers, convId) => {
          viewers.delete(uid)
          if (viewers.size === 0) {
            activeConversations.delete(convId)
          }
        })
      }
    })
  });
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
  // Presence (online/offline + focus/blur + snapshot)
  registerPresence(io, { userService })

  // Chat/typing events (kept separate)
  registerChatEvents(io)

  // Save instance for helpers
  ioInstance = io

  return io
}
