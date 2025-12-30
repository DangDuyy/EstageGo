import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUsersStatus } from '@/redux/user/userSlice'
import { PresenceBadge } from '@/components/common/PresenceBadge'
import { pickPeerStatus } from '@/utils/formatters'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/**
 * ChatHeader
 * Display chat partner info with online/offline status
 * @param {{ 
 *   otherUser: { _id, fullName, avatar },
 *   conversation?: object,
 *   onBack?: () => void
 *   rightSlot?: React.ReactNode
 *   borderless?: boolean
 *   className?: string
 * }} props
 */
export function ChatHeader({ otherUser, conversation, onBack, rightSlot, borderless = false, className = '' }) {
  const navigate = useNavigate()
  const usersStatus = useSelector(selectUsersStatus)
  
  const handleProfileClick = () => {
    if (otherUser?._id) {
      navigate(`/agents/${otherUser._id}`)
    }
  }
  
  // Get presence status from store or conversation data
  const peerStatus = conversation 
    ? pickPeerStatus(conversation, usersStatus)
    : {
        isOnline: usersStatus[otherUser?._id]?.isOnline || otherUser?.isOnline || false,
        lastActiveAt: usersStatus[otherUser?._id]?.lastActiveAt || otherUser?.lastActiveAt || null
      }

  if (!otherUser) {
    return (
      <div className="border-b p-4">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const displayName = otherUser.fullName || otherUser.userName || 'User'
  const avatarUrl = otherUser.avatar || otherUser.avatarUrl || ''
  const initialChar = displayName.charAt(0).toUpperCase()

  const rootClass = `${borderless ? '' : 'border-b'} bg-white dark:bg-gray-900 shadow-sm ${className}`

  return (
    <div className={rootClass}>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Back button - mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        <button
          onClick={handleProfileClick}
          className="hover:opacity-80 transition"
          title="View profile"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initialChar}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* User info */}
        <button
          onClick={handleProfileClick}
          className="flex-1 min-w-0 text-left hover:opacity-80 transition"
          title="View profile"
        >
          <h2 className="font-semibold text-base truncate">{displayName}</h2>
          <PresenceBadge 
            isOnline={peerStatus.isOnline} 
            lastActiveAt={peerStatus.lastActiveAt}
            className="mt-0.5"
          />
        </button>

        {/* Actions - can add call, video, info buttons here */}
        <div className="flex items-center gap-1">
          {rightSlot}
        </div>
      </div>
    </div>
  )
}
