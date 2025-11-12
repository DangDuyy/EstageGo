import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, Search } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useConversations } from '@/hooks/useConversations'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { emitTypingStart, emitTypingStop } from '@/lib/socket'
import { formatDistanceToNow } from 'date-fns'

export default function Message() {
  const currentUser = useSelector(selectCurrentUser)
  const location = useLocation()
  const { conversations, loading: conversationsLoading } = useConversations()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const { messages, loading: messagesLoading, sending, typingUsers, sendMessage } = useChat(
    selectedConversation?._id
  )

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto select conversation from navigation state
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c._id === location.state.conversationId)
      if (conv) {
        setSelectedConversation(conv)
      }
    }
  }, [location.state, conversations])

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    await sendMessage(messageText)
    setMessageText('')
  }

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessageText(e.target.value)

    if (!selectedConversation?._id) return

    // Emit typing start
    emitTypingStart(selectedConversation._id)

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Emit typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(selectedConversation._id)
    }, 2000)
  }

  // Get other user in conversation
  const getOtherUser = (conversation) => {
    if (!conversation || !currentUser) return null
    return conversation.participants?.find((p) => p._id !== currentUser._id)
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherUser(conv)
    const searchLower = searchQuery.toLowerCase()
    return (
      otherUser?.fullName?.toLowerCase().includes(searchLower) ||
      otherUser?.userName?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.text?.toLowerCase().includes(searchLower)
    )
  })

  // Get typing user names
  const typingUserNames = typingUsers
    .filter((uid) => uid !== currentUser?._id)
    .map((uid) => {
      const participant = selectedConversation?.participants?.find((p) => p._id === uid)
      return participant?.fullName || participant?.userName || 'Someone'
    })

  return (
    <ContentLayout title="Messages">
      <div className="h-[calc(100vh-200px)] flex gap-4">
        {/* Conversations List */}
        <Card className="w-80 flex flex-col">
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
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="p-2">
                {filteredConversations.map((conv) => {
                  const otherUser = getOtherUser(conv)
                  const isSelected = selectedConversation?._id === conv._id

                  return (
                    <div
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback>
                          {otherUser?.fullName?.charAt(0) || otherUser?.userName?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {otherUser?.fullName || otherUser?.userName || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.text || 'No messages yet'}
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

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherUser(selectedConversation)?.avatar} />
                  <AvatarFallback>
                    {getOtherUser(selectedConversation)?.fullName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {getOtherUser(selectedConversation)?.fullName || 
                     getOtherUser(selectedConversation)?.userName || 
                     'Unknown'}
                  </p>
                  {typingUserNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
                    </p>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId._id === currentUser?._id
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={msg.senderId.avatar} />
                              <AvatarFallback>
                                {msg.senderId.fullName?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="break-words">{msg.text}</p>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTyping}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !messageText.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </ContentLayout>
  )
}