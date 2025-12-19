import { getNotificationsAPI, markAllNotificationsReadAPI, markNotificationReadAPI, deleteNotificationAPI, deleteAllNotificationsAPI } from '@/apis'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { Bell, X, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
// Import helpers
import { connectSocket, getSocket, onNotification } from '@/lib/socket'

export default function NotificationBell() {
  const currentUser = useSelector(selectCurrentUser)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items])

  // Initial fetch
  useEffect(() => {
    if (!currentUser?._id) return
    let mounted = true
    setLoading(true)
    getNotificationsAPI(1, 20).then((res) => {
      if (!mounted) return
      setItems(res.notifications || [])
      setHasMore(res.pagination?.page < res.pagination?.pages)
      setPage(1)
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [currentUser?._id])

  // Subscribe realtime từ socket chat (singleton)
  useEffect(() => {
    if (!currentUser?._id) return
    // Ensure socket is connected (in case SocketManager hasn't mounted yet)
    const socket = getSocket()
    if (!socket || !socket.connected) {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
      }
      const token = getCookie('accessToken') || localStorage.getItem('accessToken')
      if (token) connectSocket(token)
    }

    const off = onNotification((payload) => {
      setItems((prev) => [payload, ...prev])
    })
    return () => off()
  }, [currentUser?._id])

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const next = page + 1
    const res = await getNotificationsAPI(next, 20)
    setItems(prev => [...prev, ...(res.notifications || [])])
    setHasMore(res.pagination?.page < res.pagination?.pages)
    setPage(next)
    setLoading(false)
  }

  const markAllRead = async () => {
    await markAllNotificationsReadAPI()
    setItems(prev => prev.map(i => ({ ...i, read: true })))
  }

  const onItemClick = async (n) => {
    if (!n.read) {
      await markNotificationReadAPI(n._id)
      setItems(prev => prev.map(i => i._id === n._id ? { ...i, read: true } : i))
    }
    // Optional smart navigation
    if (n.meta?.propertyId) navigate(`/properties/${n.meta.propertyId}`)
    else if (n.meta?.conversationId) navigate(`/dashboard/messages/${n.meta.conversationId}`)
  }

  const deleteNotification = async (e, notificationId) => {
    e.stopPropagation() // Prevent triggering onItemClick
    await deleteNotificationAPI(notificationId)
    setItems(prev => prev.filter(i => i._id !== notificationId))
  }

  const deleteAllNotifications = async () => {
    await deleteAllNotificationsAPI()
    setItems([])
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        className="relative rounded-full p-3 hover:bg-muted transition hidden md:inline-flex"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-8 w-8" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 z-[100] w-96">
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="font-semibold">Notifications</div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button size="sm" variant="outline" onClick={markAllRead}>
                    Mark all as read
                  </Button>
                )}
                {items.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={deleteAllNotifications} title="Delete all">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-auto mb-2">
              {items.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No notifications</div>
              )}
              {items.map(n => (
                <div
                  key={n._id}
                  className={`relative group w-full text-left px-4 py-3 border-b hover:bg-muted transition cursor-pointer ${
                    n.read ? 'opacity-70' : 'bg-primary/5'
                  }`}
                  onClick={() => onItemClick(n)}
                >
                  <button
                    onClick={(e) => deleteNotification(e, n._id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                    title="Delete notification"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                  {n.title && <div className="text-sm font-medium pr-6">{n.title}</div>}
                  <div className="text-sm pr-6">{n.message}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="p-2 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}