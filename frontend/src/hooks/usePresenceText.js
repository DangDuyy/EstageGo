import { useEffect, useState } from 'react'
import { formatTimeAgo } from '@/utils/formatters'

/**
 * useRelativeTime
 * Return relative time string ("Just now", "5 minutes ago", etc.)
 * and auto-refresh every 60s
 * @param {string|Date|null} iso - ISO string or Date object
 * @param {object} options
 * @param {number} options.intervalMs - update interval, default 60000ms
 * @param {boolean} options.enabled - enable/disable auto-refresh
 */
export function useRelativeTime(iso, { intervalMs = 60000, enabled = true } = {}) {
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setNowTick(t => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])

  if (!iso) return ''
  return formatTimeAgo(iso) + (nowTick ? '' : '')
}

/**
 * usePresenceText
 * Return presence text: "Online", "Away", "Online X minutes ago", "Offline"
 * @param {{ isOnline: boolean, lastActiveAt: string|null }} param0
 */
export function usePresenceText({ isOnline, lastActiveAt }, opts) {
  const relative = useRelativeTime(lastActiveAt, opts)
  if (isOnline) return 'Online'
  else if (relative === 'Just now') return 'Away'
  else if (lastActiveAt) {
    // Don't add "ago" if it's Yesterday or date format (DD/MM or DD/MM/YYYY)
    const needsAgo = !relative.includes('/') && relative !== 'Yesterday' && relative !== 'Just now'
    return `Online ${relative}${needsAgo ? ' ago' : ''}`
  }
  return 'Offline'
}
