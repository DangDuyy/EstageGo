import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'
import { toast } from 'react-toastify'

const OLLAMA_ENDPOINT = `${API_ROOT}/v1/ollama-chat`

/**
 * sendOllamaMessage
 * Accepts either { text: string } or { input: string } and maps to the
 * backend expected schema. Some backends (or the route implemented here)
 * expect `input` instead of `text` which caused the 400 "Missing: 'input'" error.
 */
export const sendOllamaMessage = async (payload) => {
  try {
    // Normalize payload: support plain string or objects
    let body
    if (!payload) {
      body = { input: '' }
    } else if (typeof payload === 'string') {
      body = { input: payload }
    } else if (payload.input) {
      body = payload
    } else if (payload.text) {
      body = { input: payload.text }
    } else {
      body = payload
    }

    const response = await authorizeAxiosInstance.post(OLLAMA_ENDPOINT, body)
    return response.data
  } catch (err) {
    // Provide richer logs so the backend error is visible in dev tools
    const errDetails = {
      message: err.message,
      config: err.config,
      responseData: err.response?.data,
      status: err.response?.status,
    }
    console.error('Ollama API call failed:', errDetails)
    toast.error('Failed to contact Ollama chat API')
    throw err
  }
}

export default {
  sendOllamaMessage,
}
