export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}

export const formatPostDate = (date, showTime = false) => {
  if (!date) return 'N/A'
  
  const postDate = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now - postDate)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Within 1 week: show relative time
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  }
  
  // After 1 week: show absolute date
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  if (showTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return postDate.toLocaleDateString('en-US', options)
}
export const interceptorLoadingElements = (calling) => {
  const elements = document.querySelectorAll('.interceptor-loading')
  for (let i = 0; i < elements.length; i++) {
    if (calling) {
      elements[i].style.setProperty('opacity', '0.5', 'important')
      elements[i].style.setProperty('pointer-events', 'none', 'important')
      elements[i].classList.add('interceptor-loading-active')
    } else {
      elements[i].style.setProperty('opacity', 'initial', 'important')
      elements[i].style.setProperty('pointer-events', 'initial', 'important')
      elements[i].classList.remove('interceptor-loading-active')
    }
  }
}

/**
 * formatTimeAgo
 * Convert ISO date to relative time string
 * "Just now", "5 minutes", "2 hours", "Yesterday", "3 days", or "DD/MM/YYYY"
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return ""

  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return "Just now"
  if (diffMin < 60) return `${diffMin} minutes`
  if (diffHour < 24) return `${diffHour} hours`
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay} days`

  // Same year: show DD/MM
  if (date.getFullYear() === now.getFullYear()) {
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    return `${d}/${m}`
  }

  // Different year: show DD/MM/YYYY
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/**
 * extractId
 * Extract ID from various formats
 */
export function extractId(raw) {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  if (raw._id) return String(raw._id)
  if (raw.id) return String(raw.id)
  if (raw.conversationId) return String(raw.conversationId)
  return null
}

/**
 * pickPeerStatus
 * Extract peer online status from conversation or fallback
 * Used in chat UI to display user presence
 */
export const pickPeerStatus = (conversation, usersStatusMap = {}) => {
  const peer = conversation?.direct?.otherUser || conversation?.otherUser
  const peerId = extractId(peer)

  // Try to get from Redux/store first, then fallback to conversation data
  const fromStore = peerId ? usersStatusMap[peerId] : null
  const fallback = peer?.status || {}

  const isOnline = fromStore?.isOnline ?? fallback?.isOnline ?? peer?.isOnline ?? false
  const lastActiveAt = fromStore?.lastActiveAt ?? fallback?.lastActiveAt ?? peer?.lastActiveAt ?? null

  return { isOnline, lastActiveAt }
}