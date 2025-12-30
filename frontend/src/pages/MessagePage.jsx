import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, selectUsersStatus, updatePresenceStatus } from '@/redux/user/userSlice'
import { onPresenceUpdate, requestPresenceSnapshot, focusConversation, blurConversation } from '@/lib/socket'
import { ChatHeader } from '@/components/common/ChatHeader'

/**
 * MessagePage
 * Display messages and user presence status
 * Port from konnect with presence updates
 */
export default function MessagePage() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const usersStatus = useSelector(selectUsersStatus)
  
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])

  // Subscribe to presence updates
  useEffect(() => {
    const unsubscribe = onPresenceUpdate(({ userId, isOnline, lastActiveAt }) => {
      dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
    })

    return unsubscribe
  }, [dispatch])

  // Request initial presence snapshot for all users in conversation
  useEffect(() => {
    if (!conversation) return

    const otherUser = conversation?.direct?.otherUser || conversation?.otherUser
    if (otherUser?._id) {
      requestPresenceSnapshot([otherUser._id]).then(snapshot => {
        if (Array.isArray(snapshot)) {
          snapshot.forEach(({ userId, isOnline, lastActiveAt }) => {
            dispatch(updatePresenceStatus({ userId, isOnline, lastActiveAt }))
          })
        }
      })
    }
  }, [conversation, dispatch])

  // Mark conversation as focused for typing indicators
  useEffect(() => {
    if (!conversation?._id) return
    focusConversation(conversation._id)
    return () => blurConversation(conversation._id)
  }, [conversation?._id])

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen">Please login to see messages</div>
  }

  const otherUser = conversation?.direct?.otherUser || conversation?.otherUser

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Header with Presence */}
      {otherUser && (
        <ChatHeader 
          otherUser={otherUser}
          conversation={conversation}
        />
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Start a conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg._id} 
                className={`flex ${msg.sender?._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender?._id === currentUser._id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">{msg.sender?.fullName}</p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t bg-white dark:bg-gray-900 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
