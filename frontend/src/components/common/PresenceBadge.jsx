import React from 'react'
import { usePresenceText } from '@/hooks/usePresenceText'

/**
 * PresenceBadge
 * Display user online/offline status with colored dot
 * @param {{ isOnline: boolean, lastActiveAt: string|null, className?: string }} props
 */
export function PresenceBadge({ isOnline, lastActiveAt, className = '' }) {
  const presenceText = usePresenceText({ isOnline, lastActiveAt })
  const tone = isOnline ? 'online' : lastActiveAt && presenceText !== 'Offline' ? 'away' : 'offline'

  const dotColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  }[tone]

  const textColor = {
    online: 'text-green-600',
    away: 'text-yellow-600',
    offline: 'text-gray-600'
  }[tone]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
      <span className={`text-sm ${textColor}`}>{presenceText}</span>
    </div>
  )
}

/**
 * PresenceIndicator
 * Simple inline presence indicator (just dot + text)
 */
export function PresenceIndicator({ isOnline, lastActiveAt }) {
  const presenceText = usePresenceText({ isOnline, lastActiveAt })
  const tone = isOnline ? 'online' : lastActiveAt && presenceText !== 'Offline' ? 'away' : 'offline'

  const dotColor = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-muted-foreground'
  }[tone]

  return (
    <span className="text-xs text-muted-foreground">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} mr-1`}></span>
      {presenceText}
    </span>
  )
}
