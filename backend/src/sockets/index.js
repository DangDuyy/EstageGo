import { Server } from 'socket.io'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    const decoded = await JwtProvider.verifyToken(token, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    socket.user = { id: decoded._id, email: decoded.email }
    next()
  } catch (error) {
    next(new Error('Authentication error: Invalid token'))
  }
}

// Register chat events
const registerChatEvents = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user?.id
    console.log(`[Socket] User connected: ${userId}`)

    if (userId) {
      // Join user's personal room
      socket.join(`user:${userId}`)
    }

    // Join conversation room
    socket.on('conversation:join', ({ conversationId }) => {
      if (!conversationId) return
      socket.join(`conversation:${conversationId}`)
      console.log(`[Socket] User ${userId} joined conversation: ${conversationId}`)
    })

    // Leave conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId) return
      socket.leave(`conversation:${conversationId}`)
      console.log(`[Socket] User ${userId} left conversation: ${conversationId}`)
    })

    // Typing indicators
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

  return io
}
