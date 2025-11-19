/**
 * VAPI API Client
 * Communicates with enhanced AI assistant backend
 */

import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'

const VAPI_ENDPOINT = `${API_ROOT}/v1/vapi`

/**
 * Chat with AI assistant (enhanced with database + route knowledge)
 * @param {string} message - User message
 * @param {Array} messages - Conversation history (optional)
 * @param {boolean} includeContext - Include full context (default: true)
 */
export const sendVAPIMessage = async (message, messages = [], includeContext = true) => {
  try {
    const response = await authorizeAxiosInstance.post(`${VAPI_ENDPOINT}/chat`, {
      message,
      messages,
      includeContext
    })
    return response.data
  } catch (error) {
    console.error('Error sending VAPI message:', error)
    throw error
  }
}

/**
 * Stream chat response (Server-Sent Events)
 * @param {string} message - User message
 * @param {Array} messages - Conversation history
 * @param {Function} onChunk - Callback for each chunk
 * @param {Function} onComplete - Callback when done
 * @param {Function} onError - Callback on error
 */
export const streamVAPIChat = async (message, messages = [], { onChunk, onComplete, onError }) => {
  try {
    const token = localStorage.getItem('accessToken')
    const headers = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${VAPI_ENDPOINT}/stream-chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, messages })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { value, done } = await reader.read()
      
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            
            if (parsed.error) {
              onError?.(new Error(parsed.error))
              return
            }
            
            if (parsed.chunk && !parsed.done) {
              onChunk?.(parsed.chunk)
            }
            
            if (parsed.done) {
              onComplete?.(parsed.fullResponse || '')
              return
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming VAPI chat:', error)
    onError?.(error)
  }
}

/**
 * Execute a specific function
 * @param {string} functionName - Function to execute (searchProperties, getNavigationRoute, etc.)
 * @param {Object} args - Function arguments
 */
export const executeVAPIFunction = async (functionName, args = {}) => {
  try {
    const response = await authorizeAxiosInstance.post(`${VAPI_ENDPOINT}/execute-function`, {
      functionName,
      args
    })
    return response.data
  } catch (error) {
    console.error('Error executing VAPI function:', error)
    throw error
  }
}

/**
 * Get available functions
 */
export const getVAPIFunctions = async () => {
  try {
    const response = await authorizeAxiosInstance.get(`${VAPI_ENDPOINT}/functions`)
    return response.data
  } catch (error) {
    console.error('Error getting VAPI functions:', error)
    throw error
  }
}

/**
 * Get system context (for debugging)
 */
export const getVAPIContext = async (userQuery = '', messages = []) => {
  try {
    const response = await authorizeAxiosInstance.post(`${VAPI_ENDPOINT}/context`, {
      userQuery,
      messages
    })
    return response.data
  } catch (error) {
    console.error('Error getting VAPI context:', error)
    throw error
  }
}

/**
 * Get greeting message from backend (ESTAGEGO AI identity)
 */
export const getVAPIGreeting = async () => {
  try {
    const response = await authorizeAxiosInstance.get(`${VAPI_ENDPOINT}/greeting`)
    return response.data
  } catch (error) {
    console.error('Error getting VAPI greeting:', error)
    throw error
  }
}

/**
 * Health check
 */
export const checkVAPIHealth = async () => {
  try {
    const response = await authorizeAxiosInstance.get(`${VAPI_ENDPOINT}/health`)
    return response.data
  } catch (error) {
    console.error('Error checking VAPI health:', error)
    throw error
  }
}

export const vapiAPI = {
  sendMessage: sendVAPIMessage,
  streamChat: streamVAPIChat,
  executeFunction: executeVAPIFunction,
  getFunctions: getVAPIFunctions,
  getContext: getVAPIContext,
  getGreeting: getVAPIGreeting,
  checkHealth: checkVAPIHealth
}

export default vapiAPI
