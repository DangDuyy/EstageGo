/**
 * Utility functions for property link detection in messages
 */

/**
 * Extract property ID from various URL formats
 * @param {string} url - The URL to parse
 * @returns {string|null} The property ID or null if not found
 */
export const extractPropertyIdFromUrl = (url) => {
  try {
    const urlObj = new URL(url)
    
    // Pattern: /properties/{id}
    const match = urlObj.pathname.match(/\/properties\/([a-zA-Z0-9]+)/)
    if (match) {
      return match[1]
    }
    
    return null
  } catch (err) {
    // If URL is invalid, try regex pattern
    const match = url.match(/\/properties\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }
}

/**
 * Detect all property links in a text message
 * @param {string} text - The message text
 * @returns {Array<{text: string, propertyId: string, index: number}>} Array of detected property links
 */
export const detectPropertyLinks = (text) => {
  if (!text || typeof text !== 'string') return []

  const results = []
  
  // Pattern to match URLs and relative paths for properties
  // Matches: http://...properties/ID, https://...properties/ID, /properties/ID
  const urlPattern = /(?:https?:\/\/[^\s]+\/properties\/([a-zA-Z0-9]+)|\/properties\/([a-zA-Z0-9]+))/g
  
  let match
  while ((match = urlPattern.exec(text)) !== null) {
    const propertyId = match[1] || match[2]
    results.push({
      text: match[0],
      propertyId,
      index: match.index
    })
  }

  return results
}

/**
 * Parse message to extract text and property links
 * @param {string} text - The message text
 * @returns {Object} Object with text parts and properties
 */
export const parseMessageWithProperties = (text) => {
  const properties = detectPropertyLinks(text)
  
  if (properties.length === 0) {
    return {
      hasProperties: false,
      parts: [{ type: 'text', content: text }],
      properties: []
    }
  }

  const parts = []
  let lastIndex = 0

  properties.forEach((prop) => {
    // Add text before the link
    if (prop.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, prop.index)
      })
    }

    // Add the property link
    parts.push({
      type: 'property',
      propertyId: prop.propertyId,
      url: prop.text
    })

    lastIndex = prop.index + prop.text.length
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }

  return {
    hasProperties: true,
    parts,
    properties: properties.map(p => p.propertyId)
  }
}
