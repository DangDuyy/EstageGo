// sockets/presence.js
// Ported and adapted from konnect backend presence logic

const VIEW_TTL_MS = 60_000 // consider viewing if focused within last 60s

export const presence = {
  online: new Map(), // userId -> { sockets:Set<string>, lastActiveAt:Date }
  activeConv: new Map(), // userId -> { conversationId:string, ts:number }

  // helpers
  isOnline(userId) {
    return this.online.has(String(userId))
  },
  isViewing(userId, conversationId, ttl = VIEW_TTL_MS) {
    const a = this.activeConv.get(String(userId))
    if (!a) return false
    if (String(a.conversationId) !== String(conversationId)) return false
    return (Date.now() - a.ts) <= ttl
  },

  // internal mutators
  _setOnline(userId, socketId) {
    const uid = String(userId)
    let entry = this.online.get(uid)
    if (!entry) entry = { sockets: new Set(), lastActiveAt: new Date() }
    entry.sockets.add(socketId)
    entry.lastActiveAt = new Date()
    this.online.set(uid, entry)
  },
  _setOffline(userId, socketId) {
    const uid = String(userId)
    const entry = this.online.get(uid)
    if (!entry) return
    entry.sockets.delete(socketId)
    if (entry.sockets.size === 0) this.online.delete(uid)
  },
  _setActive(userId, conversationId) {
    this.activeConv.set(String(userId), {
      conversationId: String(conversationId),
      ts: Date.now()
    })
  },
  _clearActive(userId, conversationIdMaybe) {
    const uid = String(userId)
    if (!this.activeConv.has(uid)) return
    if (conversationIdMaybe) {
      const cur = this.activeConv.get(uid)
      if (cur && String(cur.conversationId) !== String(conversationIdMaybe)) return
    }
    this.activeConv.delete(uid)
  }
}

/**
 * Register socket presence (ONLINE/OFFLINE) + focus/blur
 * Note: conversation:join is handled elsewhere in EstageGo to avoid duplication.
 * @param {import('socket.io').Server} io
 * @param {{ userService: { markUserStatus: (userId: string, payload: {isOnline:boolean, lastActiveAt:Date}) => any } }} deps
 */
export function registerPresence(io, { userService }) {
  io.on('connection', (socket) => {
    const authedUserId =
      socket.user?.id ||
      socket.user?._id ||
      socket.handshake?.auth?.userId ||
      null

    if (authedUserId) {
      socket.join(`user:${String(authedUserId)}`)
      presence._setOnline(authedUserId, socket.id)

      const entry = presence.online.get(String(authedUserId))
      if (entry?.sockets?.size === 1) {
        const now = new Date()
        Promise.resolve(userService.markUserStatus(authedUserId, { isOnline: true, lastActiveAt: now })).catch(() => {})
        io.emit('presence:update', {
          userId: String(authedUserId),
          isOnline: true,
          lastActiveAt: now.toISOString()
        })
      }
    }

    socket.on('user:join', ({ userId }) => {
      const uid = String(userId || authedUserId || '')
      if (!uid) return
      socket.join(`user:${uid}`)
      presence._setOnline(uid, socket.id)

      const entry = presence.online.get(uid)
      if (entry?.sockets?.size === 1) {
        const now = new Date()
        Promise.resolve(userService.markUserStatus(uid, { isOnline: true, lastActiveAt: now })).catch(() => {})
        io.emit('presence:update', { userId: uid, isOnline: true, lastActiveAt: now.toISOString() })
      }
    })

    socket.on('presence:heartbeat', () => {
      const uid = String(authedUserId || '')
      if (!uid) return
      const entry = presence.online.get(uid)
      if (entry) entry.lastActiveAt = new Date()
    })

    socket.on('presence:snapshot', async (userIds = []) => {
      const ids = (Array.isArray(userIds) ? userIds : []).map(String).filter(Boolean)
      if (!ids.length) return socket.emit('presence:snapshot', [])

      const payload = []
      const offlineIds = []

      for (const uid of ids) {
        const entry = presence.online.get(uid)
        if (entry) {
          payload.push({
            userId: uid,
            isOnline: true,
            lastActiveAt: entry.lastActiveAt ? entry.lastActiveAt.toISOString() : null
          })
        } else {
          offlineIds.push(uid)
        }
      }

      if (offlineIds.length && typeof userService?.getPresenceSnapshot === 'function') {
        try {
          const rows = await userService.getPresenceSnapshot(offlineIds)
          for (const row of rows) {
            payload.push({
              userId: String(row.userId),
              isOnline: !!row.isOnline,
              lastActiveAt: row.lastActiveAt ? new Date(row.lastActiveAt).toISOString() : null
            })
          }
        } catch (e) {
          // swallow errors to avoid breaking snapshot
        }
      }

      socket.emit('presence:snapshot', payload)
    })

    socket.on('conversation:focus', ({ conversationId }) => {
      const uid = String(authedUserId || '')
      if (!uid || !conversationId) return
      presence._setActive(uid, conversationId)
    })

    socket.on('conversation:blur', ({ conversationId }) => {
      const uid = String(authedUserId || '')
      if (!uid) return
      presence._clearActive(uid, conversationId)
    })

    socket.on('user:logout', () => {
      const uid = String(authedUserId || '')
      if (!uid) return

      const wasOnline = presence.isOnline(uid)
      const entry = presence.online.get(uid)
      const allSids = entry ? Array.from(entry.sockets) : []

      for (const sid of allSids) {
        presence._setOffline(uid, sid)
        if (sid !== socket.id) {
          const otherSock = io.sockets.sockets.get(sid)
          try { otherSock?.disconnect(true) } catch {}
        }
      }

      presence._clearActive(uid)

      if (wasOnline && !presence.isOnline(uid)) {
        const lastActiveAt = new Date()
        Promise.resolve(userService.markUserStatus(uid, { isOnline: false, lastActiveAt })).catch(() => {})
        io.emit('presence:update', {
          userId: uid,
          isOnline: false,
          lastActiveAt: lastActiveAt.toISOString()
        })
      }

      try { socket.disconnect(true) } catch {}
    })

    socket.on('disconnect', () => {
      const uid = String(authedUserId || '')
      if (!uid) return

      const wasOnline = presence.isOnline(uid)
      presence._setOffline(uid, socket.id)

      if (wasOnline && !presence.isOnline(uid)) {
        presence._clearActive(uid)
        const lastActiveAt = new Date()
        Promise.resolve(userService.markUserStatus(uid, { isOnline: false, lastActiveAt })).catch(() => {})
        io.emit('presence:update', {
          userId: uid,
          isOnline: false,
          lastActiveAt: lastActiveAt.toISOString()
        })
      }
    })
  })
}

export const presenceSingleton = presence
export default presence
