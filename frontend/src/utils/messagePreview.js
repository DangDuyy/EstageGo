/**
 * Generate preview text for last message in conversation list
 * Handles: text messages, attachments, reactions
 */

export const getConversationPreviewText = (lastMessage, maxLength = 20) => {
  if (!lastMessage) {
    return 'No messages yet'
  }

  // Normalize attachments/files
  const attachments = Array.isArray(lastMessage.attachments)
    ? lastMessage.attachments
    : Array.isArray(lastMessage.files)
    ? lastMessage.files
    : []

  // Check for attachments first
  if (attachments.length > 0) {
    const types = new Set()
    
    attachments.forEach(att => {
      const t = (att.type || att.mimetype || '').toLowerCase()
      const url = (att.url || att.path || '').toLowerCase()
      const isImage = t.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|avif)$/.test(url)
      const isAudio = t.startsWith('audio/') || /\.(mp3|wav|ogg|webm)$/.test(url)
      const isVideo = t.startsWith('video/') || /\.(mp4|mov|webm|avi)$/.test(url)

      if (isImage) types.add('ảnh')
      else if (isAudio) types.add('file voice')
      else if (isVideo) types.add('video')
      else types.add('file')
    })

    const typeList = Array.from(types).join(', ')
    const count = attachments.length > 1 ? ` (${attachments.length})` : ''
    return `Đã gửi ${typeList}${count}`
  }

  // Handle text message
  if (lastMessage.text) {
    const text = lastMessage.text.trim()
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...'
    }
    return text
  }

  // Fallback if message has no text and no attachments
  return 'No messages yet'
}
