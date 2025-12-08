import { Notification } from '~/models/notificationModel'
import { emitNotification } from '~/sockets'

export const notificationController = {
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.jwtDecoded?._id || req.user?._id
      const page = Math.max(1, parseInt(req.query.page || '1', 10))
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '20', 10)))
      const skip = (page - 1) * limit

      const [items, total] = await Promise.all([
        Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Notification.countDocuments({ user: userId })
      ])

      res.json({
        notifications: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      })
    } catch (e) { next(e) }
  },

  async markRead(req, res, next) {
    try {
      const userId = req.jwtDecoded?._id || req.user?._id
      const { id } = req.params
      const doc = await Notification.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: { read: true } },
        { new: true }
      )
      if (!doc) return res.status(404).json({ message: 'Not found' })
      res.json(doc)
    } catch (e) { next(e) }
  },

  async markAllRead(req, res, next) {
    try {
      const userId = req.jwtDecoded?._id || req.user?._id
      await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } })
      res.json({ success: true })
    } catch (e) { next(e) }
  },

  async createNotification(req, res, next) {
    try {
      const userId = req.jwtDecoded?._id || req.user?._id
      const { type, title, message, meta } = req.body
      const doc = await Notification.create({ user: userId, type, title, message, meta })
      
      emitNotification(String(userId), {
        _id: doc._id,
        type: doc.type,
        title: doc.title,
        message: doc.message,
        meta: doc.meta,
        read: doc.read,
        createdAt: doc.createdAt
      })

      res.status(201).json(doc)
    } catch (e) { next(e) }
  }
}