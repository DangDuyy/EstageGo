/**
 * VAPI Controller
 * Handles AI assistant requests with comprehensive understanding of database and routes
 */

import { StatusCodes } from 'http-status-codes'
import { vapiService } from '~/services/vapiService.js'
import { contextBuilderService } from '~/services/contextBuilderService.js'

/**
 * Chat with AI assistant (enhanced version)
 */
export const chat = async (req, res) => {
  try {
    const { message, messages = [], includeContext = true } = req.body
    
    if (!message || typeof message !== 'string') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Message is required and must be a string'
      })
    }
    
    // Get user profile if authenticated
    const userProfile = req.user || null
    
    // Chat with function calling support
    const result = await vapiService.chatWithFunctionCalling(message, {
      messages,
      userProfile,
      includeContext
    })
    
    res.status(StatusCodes.OK).json(result)
    
  } catch (error) {
    console.error('Error in chat controller:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Execute a specific function (for direct function calling)
 */
export const executeFunction = async (req, res) => {
  try {
    const { functionName, args = {} } = req.body
    
    if (!functionName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'functionName is required'
      })
    }
    
    const result = await vapiService.executeFunction(functionName, args)
    
    res.status(StatusCodes.OK).json(result)
    
  } catch (error) {
    console.error('Error in executeFunction controller:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Get available functions and their definitions
 */
export const getFunctions = async (req, res) => {
  try {
    const functions = vapiService.getFunctionDefinitions()
    
    res.status(StatusCodes.OK).json({
      success: true,
      functions
    })
    
  } catch (error) {
    console.error('Error in getFunctions controller:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Get system context (for debugging or frontend display)
 */
export const getContext = async (req, res) => {
  try {
    const { userQuery = '', messages = [] } = req.body
    const userProfile = req.user || null
    
    const context = await contextBuilderService.buildCompleteContext({
      userQuery,
      messages,
      userProfile,
      includeDatabase: true,
      includeRoutes: true,
      includeExamples: false // Don't include examples for context preview
    })
    
    res.status(StatusCodes.OK).json({
      success: true,
      context: {
        systemPrompt: context.systemPrompt.substring(0, 500) + '...', // Preview only
        conversationContext: context.conversationContext,
        dynamicContext: context.dynamicContext,
        hasFullContext: true
      }
    })
    
  } catch (error) {
    console.error('Error in getContext controller:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Get greeting message for voice assistant
 */
export const getGreeting = async (req, res) => {
  try {
    const userProfile = req.user || null
    
    // Build greeting with ESTAGEGO identity
    let greeting = '🎯 Xin chào! Tôi là EstageGo AI Assistant - trợ lý thông minh về bất động sản.'
    
    if (userProfile) {
      greeting += ` Chào ${userProfile.fullName || userProfile.userName}!`
    }
    
    greeting += ' Tôi có thể giúp bạn tìm kiếm BĐS, tư vấn về thị trường, hoặc hướng dẫn sử dụng các tính năng. Bạn cần giúp gì không?'
    
    res.status(StatusCodes.OK).json({
      success: true,
      greeting,
      identity: 'ESTAGEGO AI ASSISTANT - TRỢ LÝ THÔNG MINH VỀ BẤT ĐỘNG SẢN'
    })
    
  } catch (error) {
    console.error('Error in getGreeting controller:', error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Stream chat response (for real-time streaming)
 */
export const streamChat = async (req, res) => {
  try {
    const { message, messages = [] } = req.body
    
    if (!message) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Message is required'
      })
    }
    
    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    
    const userProfile = req.user || null
    
    // Build context
    const context = await contextBuilderService.buildCompleteContext({
      userQuery: message,
      messages,
      userProfile,
      includeDatabase: true,
      includeRoutes: true,
      includeExamples: true
    })
    
    // Stream from Ollama
    const fetch = (await import('node-fetch')).default
    const { env } = await import('~/config/environment.js')
    
    const response = await fetch(`${env.OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: message,
        system: context.fullContext,
        stream: true,
        keep_alive: '10m',
        options: { num_predict: -1, temperature: 0.7 }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }
    
    let fullResponse = ''
    const body = response.body
    
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        buf += decoder.decode(value, { stream: true })
        let idx
        
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim()
          buf = buf.slice(idx + 1)
          
          if (!line) continue
          
          try {
            const obj = JSON.parse(line)
            if (obj.response) {
              fullResponse += obj.response
              // Send chunk to client
              res.write(`data: ${JSON.stringify({ chunk: obj.response, done: false })}\n\n`)
            }
            if (obj.done) {
              res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullResponse })}\n\n`)
              res.end()
              return
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    }
    
    res.end()
    
  } catch (error) {
    console.error('Error in streamChat controller:', error)
    res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`)
    res.end()
  }
}

export const vapiController = {
  chat,
  executeFunction,
  getFunctions,
  getContext,
  streamChat,
  getGreeting
}
