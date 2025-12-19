/**
 * Generate preview text for last message in conversation list
 * Handles: text messages, attachments, reactions
 */

export const getConversationPreviewText = (lastMessage, maxLength = 20) => {
  if (!lastMessage) {
    return 'No messages yet'
  }

  // Check for attachments first
  if (Array.isArray(lastMessage.attachments) && lastMessage.attachments.length > 0) {
    const attachments = lastMessage.attachments
    const types = new Set()
    
    attachments.forEach(att => {
      if (att.type === 'image') types.add('ảnh')
      else if (att.type === 'audio') types.add('file voice')
      else if (att.type === 'video') types.add('video')
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
