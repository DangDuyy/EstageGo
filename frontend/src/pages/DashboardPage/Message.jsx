import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Send, Loader2, Search, Paperclip, Mic, MoreHorizontal, PanelRightClose, PanelRightOpen, Info } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useConversations } from '@/hooks/useConversations'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, selectUsersStatus, updatePresenceStatus } from '@/redux/user/userSlice'
import { emitTypingStart, emitTypingStop, joinConversation, leaveConversation, requestPresenceSnapshot, onPresenceUpdate } from '@/lib/socket'
import ReactionButton from '@/components/common/Chat/ReactionButton'
import { deleteMessageForMeAPI, recallMessageAPI, toggleReactionAPI } from '@/apis'
import { formatDistanceToNow } from 'date-fns'
import PropertyPreview from '@/components/common/Chat/PropertyPreview'
import MessageContent from '@/components/common/Chat/MessageContent'
import { getConversationPreviewText } from '@/utils/messagePreview'
import ChatSidebarRight from '@/components/common/Chat/ChatSidebarRight'
import { ChatHeader } from '@/components/common/ChatHeader'

const toDateKey = (date) => {
  const d = new Date(date || Date.now())
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDateChip = (dateObj, count) => {
  const d = new Date(dateObj)
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
  return count === 1 ? `${time} ${date}` : date
}

const groupByDay = (items = []) => {
  const map = new Map()
  items.forEach((m) => {
    const key = toDateKey(m.createdAt || m.timestamp || Date.now())
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(m)
  })
  return Array.from(map.entries()).map(([key, arr]) => ({ key, items: arr }))
}

const formatTimeOnly = (dateObj) => {
  if (!dateObj) return ''
  const d = new Date(dateObj)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function Message() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const usersStatus = useSelector(selectUsersStatus)
  const location = useLocation()
  const navigate = useNavigate()
  const { conversationId: paramConversationId } = useParams()
  const { conversations, loading: conversationsLoading } = useConversations()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const messagesStartRef = useRef(null)
  const scrollAreaRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const previousScrollHeight = useRef(0)
  const [locallyDeletedIds, setLocallyDeletedIds] = useState(new Set())
  const [contextMenu, setContextMenu] = useState({ openForId: null, x: 0, y: 0 })
  const contextMenuRef = useRef(null)
  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImageUrl, setViewerImageUrl] = useState(null)
  const [sidebarRightOpen, setSidebarRightOpen] = useState(false)

  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    sending,
    typingUsers,
    pagination,
    sendMessage,
    loadMoreMessages
  } = useChat(selectedConversation?._id)

  // Handle route parameter - select conversation from URL
  useEffect(() => {
    if (paramConversationId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find((c) => c._id === paramConversationId)
      if (conv) {
        setSelectedConversation(conv)
      }
    }
  }, [paramConversationId, conversations, selectedConversation])

  // Update URL when conversation is selected
  useEffect(() => {
    if (selectedConversation?._id && selectedConversation._id !== paramConversationId) {
      navigate(`/dashboard/messages/${selectedConversation._id}`, { replace: false })
    }
  }, [selectedConversation?._id, paramConversationId, navigate])

  // Join/leave conversation rooms for presence tracking
  useEffect(() => {
    if (!selectedConversation?._id) return
    
    const conversationId = selectedConversation._id
    joinConversation(conversationId)
    
    // Cleanup: leave room when switching conversations or unmounting
    return () => {
      leaveConversation(conversationId)
    }
  }, [selectedConversation?._id])

  // Auto scroll to bottom when conversation is selected or messages load
  useEffect(() => {
    if (!selectedConversation?._id) return
    
    const scrollToBottom = () => {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        // Cuộn container trực tiếp
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
    
    // Thử nhiều lần để đảm bảo DOM render xong
    scrollToBottom()
    setTimeout(scrollToBottom, 100)
    setTimeout(scrollToBottom, 300)
  }, [selectedConversation?._id])

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return
    const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
    if (isNearBottom || messages.length === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!contextMenu.openForId) return

    const handleClickOutside = (e) => {
      if (!contextMenuRef.current) return
      if (!contextMenuRef.current.contains(e.target)) {
        setContextMenu({ openForId: null, x: 0, y: 0 })
      }
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setContextMenu({ openForId: null, x: 0, y: 0 })
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [contextMenu.openForId])

  useEffect(() => {
    if (!messagesStartRef.current || !pagination.hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
          if (scrollContainer) previousScrollHeight.current = scrollContainer.scrollHeight
          loadMoreMessages()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(messagesStartRef.current)
    return () => observer.disconnect()
  }, [pagination.hasMore, loadingMore, loadMoreMessages])

  useEffect(() => {
    if (!loadingMore && previousScrollHeight.current > 0) {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        const newScrollHeight = scrollContainer.scrollHeight
        scrollContainer.scrollTop = newScrollHeight - previousScrollHeight.current
        previousScrollHeight.current = 0
      }
    }
  }, [messages, loadingMore])

  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === location.state.conversationId)
      if (conv) setSelectedConversation(conv)
    }
  }, [location.state, conversations])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (sending) return
    const hasText = !!messageText.trim()
    const hasFiles = attachedFiles.length > 0
    if (!hasText && !hasFiles) return
    await sendMessage({ text: messageText, files: attachedFiles })
    setMessageText('')
    setAttachedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleTyping = (e) => {
    setMessageText(e.target.value)
    if (!selectedConversation?._id) return
    emitTypingStart(selectedConversation._id)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(selectedConversation._id)
    }, 2000)
  }

  const getOtherUser = (conversation) => {
    if (!conversation || !currentUser) return null
    return conversation.participants?.find((p) => p._id !== currentUser._id)
  }

  const otherUser = useMemo(() => getOtherUser(selectedConversation), [selectedConversation, currentUser])
  const conversationForHeader = useMemo(() => {
    if (!selectedConversation) return null
    return {
      ...selectedConversation,
      direct: { otherUser }
    }
  }, [selectedConversation, otherUser])

  // Subscribe realtime presence updates
  useEffect(() => {
    const off = onPresenceUpdate(({ userId, isOnline, lastActiveAt }) => {
      dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
    })
    return off
  }, [dispatch])

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherUser(conv)
    const searchLower = searchQuery.toLowerCase()
    const previewText = getConversationPreviewText(conv.lastMessage, 200).toLowerCase()
    return (
      otherUser?.fullName?.toLowerCase().includes(searchLower) ||
      otherUser?.userName?.toLowerCase().includes(searchLower) ||
      previewText.includes(searchLower)
    )
  })

  const typingUserNames = typingUsers
    .filter((uid) => uid !== currentUser?._id)
    .map((uid) => {
      const participant = selectedConversation?.participants?.find((p) => p._id === uid)
      return participant?.fullName || participant?.userName || 'Someone'
    })

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.timestamp || 0).getTime()
      const bTime = new Date(b.createdAt || b.timestamp || 0).getTime()
      return aTime - bTime
    })
  }, [messages])

  const groupedMessages = useMemo(() => groupByDay(sortedMessages), [sortedMessages])

  const typingUser = useMemo(() => {
    if (!selectedConversation) return null
    const typingId = typingUsers.find((uid) => uid !== currentUser?._id)
    if (!typingId) return null
    return selectedConversation.participants?.find((p) => p._id === typingId) || null
  }, [typingUsers, selectedConversation, currentUser])

  const participantMap = useMemo(() => {
    const map = new Map()
    selectedConversation?.participants?.forEach((p) => {
      if (p?._id) map.set(String(p._id), p)
    })
    return map
  }, [selectedConversation])

  // Presence snapshot for other user
  useEffect(() => {
    if (!otherUser?._id) return
    requestPresenceSnapshot([otherUser._id]).then((snapshot) => {
      if (Array.isArray(snapshot)) {
        snapshot.forEach(({ userId, isOnline, lastActiveAt }) => {
          dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
        })
      }
    })
  }, [otherUser?._id, dispatch])

  // Prefetch presence for all conversation participants (excluding current user)
  useEffect(() => {
    if (!conversations?.length) return
    const ids = conversations
      .flatMap((c) => (c.participants || []).map((p) => p?._id))
      .filter((id) => id && id !== currentUser?._id)
    const uniqueIds = Array.from(new Set(ids))
    if (!uniqueIds.length) return
    requestPresenceSnapshot(uniqueIds).then((snapshot) => {
      if (Array.isArray(snapshot)) {
        snapshot.forEach(({ userId, isOnline, lastActiveAt }) => {
          dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
        })
      }
    })
  }, [conversations, currentUser?._id, dispatch])

  return (
    <ContentLayout title="Messages">
      <div className="h-[calc(100vh-200px)] flex gap-2 relative">
        <Card className="w-80 flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations yet</div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conv) => {
                  const otherUser = getOtherUser(conv)
                  const isSelected = selectedConversation?._id === conv._id
                  const status = otherUser?._id ? usersStatus[otherUser._id] : null
                  const isOnline = status?.isOnline ?? otherUser?.isOnline ?? false

                  return (
                    <div
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="relative h-12 w-12 shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser?.avatar} />
                          <AvatarFallback>
                            {otherUser?.fullName?.charAt(0) || otherUser?.userName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${
                            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                          aria-hidden
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {otherUser?.fullName || otherUser?.userName || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {getConversationPreviewText(conv.lastMessage)}
                        </p>
                      </div>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${sidebarRightOpen ? 'rounded-r-none' : ''}`}>
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              <div className="border-b bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <ChatHeader
                    otherUser={otherUser}
                    conversation={conversationForHeader}
                    borderless
                  />
                  {typingUserNames.length > 0 && (
                    <p className="px-4 pb-2 -mt-2 text-xs text-muted-foreground">
                      {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={`mr-4 inline-flex items-center justify-center w-9 h-9 rounded-md border transition-colors ${sidebarRightOpen ? 'bg-accent border-primary' : 'hover:bg-muted'}`}
                  onClick={() => setSidebarRightOpen((v) => !v)}
                  title={sidebarRightOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                  {sidebarRightOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  {messagesLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : sortedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          No messages yet
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Start the conversation with a quick message
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full max-w-md px-4">
                        <p className="text-xs text-muted-foreground text-center mb-2">
                          Suggested messages:
                        </p>
                        {[
                          "Tôi cần được tư vấn về bất động sản",
                          "Tôi muốn xem thêm thông tin chi tiết",
                          "Bất động sản này còn không?",
                          "Tôi muốn đặt lịch xem nhà"
                        ].map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMessageText(suggestion)}
                            className="px-4 py-3 text-sm text-left rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200 shadow-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div ref={messagesStartRef} className="flex justify-center py-2">
                        {loadingMore && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading older messages...</span>
                          </div>
                        )}
                        {!pagination.hasMore && sortedMessages.length > 0 && (
                          <span className="text-xs text-muted-foreground">Beginning of conversation</span>
                        )}
                      </div>

                      {groupedMessages.map((group) => (
                        <div key={group.key} className="space-y-3">
                          <div className="flex justify-center my-2">
                            <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                              {formatDateChip(group.items[0]?.createdAt || group.items[0]?.timestamp, group.items.length)}
                            </span>
                          </div>

                          {group.items.map((msg, idx) => {
                            if (locallyDeletedIds.has(msg._id)) return null
                            const isOwn = msg.senderId?._id === currentUser?._id
                            const nextMsg = group.items[idx + 1]
                            const sameSenderNext = nextMsg && nextMsg.senderId?._id === msg.senderId?._id
                            const showTimestamp = !sameSenderNext

                            // Get all emojis current user has reacted with on this message
                            const userEmojis = (msg.reactions || [])
                              .filter((r) => String(r.userId) === String(currentUser?._id))
                              .map((r) => r.emoji)

                            // Group reactions by emoji with count and users
                            const reactionsByEmoji = (msg.reactions || []).reduce((acc, r) => {
                              if (!r?.emoji) return acc
                              const key = r.emoji
                              if (!acc[key]) {
                                acc[key] = { emoji: key, count: 0, userIds: [], userNames: [] }
                              }
                              acc[key].count += 1
                              acc[key].userIds.push(String(r.userId))
                              const participant = participantMap.get(String(r.userId))
                              if (participant) {
                                const name = participant.fullName || participant.userName || 'Someone'
                                if (!acc[key].userNames.includes(name)) {
                                  acc[key].userNames.push(name)
                                }
                              }
                              return acc
                            }, {})

                            const reactionGroups = Object.values(reactionsByEmoji)

                            return (
                              <div key={msg._id} className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={msg.senderId?.avatar} />
                                    <AvatarFallback>
                                      {msg.senderId?.fullName?.charAt(0) || msg.senderId?.userName?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="relative flex-1 min-w-0">
                                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                      <div className={`mb-1 flex flex-col gap-2 ${isOwn ? 'items-end' : 'items-start'}`}>
                                        {msg.attachments.map((att) => {
                                          const key = `${att.url}-${att.filename}`
                                          if (att.type === 'image') {
                                            return (
                                              <img
                                                key={key}
                                                src={att.url}
                                                alt={att.filename || 'attachment'}
                                                className="max-w-xs rounded-lg border cursor-zoom-in"
                                                onClick={() => {
                                                  setViewerImageUrl(att.url)
                                                  setViewerOpen(true)
                                                }}
                                              />
                                            )
                                          }
                                          if (att.type === 'audio') {
                                            return (
                                              <div
                                                key={key}
                                                className={`flex items-center gap-2 p-2 max-w-xs rounded-sm ${
                                                  isOwn
                                                    ? 'ml-auto bg-primary/10 border border-primary rounded-l-lg rounded-tr-lg'
                                                    : 'mr-auto bg-gray-100 text-black rounded-r-lg rounded-tl-lg'
                                                } shadow-sm`}
                                              >
                                                <audio controls className="flex-1 min-w-0">
                                                  <source src={att.url} type={att.mimetype || 'audio/webm'} />
                                                  Your browser does not support the audio element.
                                                </audio>
                                              </div>
                                            )
                                          }
                                          return (
                                            <a
                                              key={key}
                                              href={att.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs underline break-all"
                                            >
                                              {att.filename || att.url}
                                            </a>
                                          )
                                        })}
                                      </div>
                                    )}

                                    {msg.recalled ? (
                                      <div className="px-4 py-2 rounded-2xl bg-muted text-xs italic text-muted-foreground">
                                        Message was recalled
                                      </div>
                                    ) : msg.text && (
                                      <MessageContent text={msg.text} isOwn={isOwn} />
                                    )}

                                    {Array.isArray(msg.reactions) && msg.reactions.length > 0 && (
                                      <div className={`mt-2 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        {reactionGroups.map((group) => (
                                          <button
                                            key={group.emoji}
                                            type="button"
                                            onClick={() => toggleReactionAPI(msg._id, group.emoji)}
                                            className={`rounded-full px-2 py-1 text-xs flex items-center gap-1 transition ${
                                              userEmojis.includes(group.emoji)
                                                ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200'
                                                : 'bg-background border hover:bg-accent'
                                            }`}
                                            title={`${group.userNames.slice(0, 3).join(', ')}${group.userNames.length > 3 ? ` and ${group.userNames.length - 3} more` : ''}`}
                                          >
                                            <span className="text-sm">{group.emoji}</span>
                                            <span className="text-xs font-medium">{group.count}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {!msg.recalled && (
                                      <div
                                        className={`absolute top-2 flex gap-2 items-start opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition ${
                                          isOwn ? 'right-full mr-3 flex-row-reverse' : 'left-full ml-3'
                                        }`}
                                      >
                                        <div className="pointer-events-auto">
                                          <ReactionButton messageId={msg._id} userEmojis={userEmojis} />
                                        </div>
                                        <button
                                          type="button"
                                          className="pointer-events-auto h-8 w-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80"
                                          onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect()
                                            setContextMenu({
                                              openForId: msg._id,
                                              x: rect.right,
                                              y: rect.bottom
                                            })
                                          }}
                                        >
                                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                      </div>
                                    )}

                                    {showTimestamp && (
                                      <div
                                        className={`flex items-center gap-1 mt-2 text-xs text-muted-foreground ${
                                          isOwn ? 'justify-end' : 'justify-start'
                                        }`}
                                      >
                                        <span>{formatTimeOnly(msg.createdAt || msg.timestamp)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))}

                      {typingUser && (
                        <div className="flex items-end space-x-2 px-1">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={typingUser.avatar} />
                            <AvatarFallback>{typingUser.fullName?.[0] || typingUser.userName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="relative px-3 py-2 rounded-lg bg-muted text-foreground">
                            <div className="flex space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:120ms]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:240ms]" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Image viewer dialog */}
              <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                <DialogContent className="bg-black p-2 sm:max-w-3xl">
                  {viewerImageUrl && (
                    <img
                      src={viewerImageUrl}
                      alt="preview"
                      className="max-h-[80vh] w-auto object-contain mx-auto"
                      onError={(e) => {
                        e.currentTarget.alt = 'Image not available'
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>

              {contextMenu.openForId && (
                <div
                  ref={contextMenuRef}
                  className="fixed z-50 bg-white border rounded-md shadow-lg text-sm"
                  style={{ top: contextMenu.y, left: contextMenu.x - 160, minWidth: 160 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteMessageForMeAPI(contextMenu.openForId)
                        setLocallyDeletedIds((prev) => new Set(prev).add(contextMenu.openForId))
                      } catch (e) {
                        console.error('delete failed', e)
                      } finally {
                        setContextMenu({ openForId: null, x: 0, y: 0 })
                      }
                    }}
                  >
                    Delete for me
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
                    type="button"
                    onClick={async () => {
                      try {
                        await recallMessageAPI(contextMenu.openForId)
                      } catch (e) {
                        console.error('recall failed', e)
                      } finally {
                        setContextMenu({ openForId: null, x: 0, y: 0 })
                      }
                    }}
                  >
                    Recall for everyone
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setAttachedFiles(files)
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attach
                  </Button>

                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTyping}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={isRecording ? 'destructive' : 'outline'}
                    className="shrink-0"
                    onClick={async () => {
                      if (isRecording) {
                        mediaRecorderRef.current?.stop()
                        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
                        setIsRecording(false)
                      } else {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                          const mr = new MediaRecorder(stream)
                          mediaRecorderRef.current = mr
                          audioChunksRef.current = []
                          mr.ondataavailable = (event) => {
                            if (event.data.size > 0) audioChunksRef.current.push(event.data)
                          }
                          mr.onstop = async () => {
                            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                            audioChunksRef.current = []
                            const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
                            await sendMessage({ files: [file] })
                          }
                          mr.start()
                          setIsRecording(true)
                        } catch (err) {
                          console.error('Microphone error', err)
                        }
                      }
                    }}
                  >
                    <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                  </Button>
                  <Button type="submit" disabled={sending || (!messageText.trim() && attachedFiles.length === 0)}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {attachedFiles.map((f) => (
                      <span key={f.name} className="px-2 py-1 rounded bg-muted">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </form>
            </>
          )}
        </Card>

        {/* Right sidebar */}
        {selectedConversation && (
          <ChatSidebarRight
            conversation={selectedConversation}
            isOpen={sidebarRightOpen}
            onClose={() => setSidebarRightOpen(false)}
            onOpenProfile={(_p) => {
              // Optional: navigate to profile or open a modal in future
            }}
          />
        )}
      </div>
    </ContentLayout>
  )
}
