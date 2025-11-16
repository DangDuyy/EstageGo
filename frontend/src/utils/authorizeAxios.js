 
import axios from 'axios'
import { refreshTokenAPI } from '@/apis'
import { logoutUserAPI } from '@/redux/user/userSlice'
import { interceptorLoadingElements } from './formatters'
import { toast } from 'react-toastify'
import { updateSocketToken } from '@/lib/socket'

let axiosReduxStore
export const injectStore = mainStore => {
  axiosReduxStore = mainStore
}

const authorizeAxiosInstance = axios.create()

authorizeAxiosInstance.defaults.timeout = 1000 * 60 * 10

authorizeAxiosInstance.defaults.withCredentials = true

authorizeAxiosInstance.interceptors.request.use((config) => {
  interceptorLoadingElements(true)
  
  // If no cookie, try to set Authorization header from localStorage
  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
  }
  
  const cookieToken = getCookie('accessToken')
  if (!cookieToken) {
    // Fallback to localStorage
    const localToken = localStorage.getItem('accessToken')
    if (localToken) {
      config.headers.Authorization = `Bearer ${localToken}`
    }
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

let refreshTokenPromise = null

authorizeAxiosInstance.interceptors.response.use((response) => {
  interceptorLoadingElements(false)

  return response
}, (error) => {

  interceptorLoadingElements(false)

  const originalRequests = error.config
  
  // Handle 410 (token expired) or 401 (unauthorized) - try to refresh token
  if ((error.response?.status === 410 || error.response?.status === 401) && !originalRequests._retry) {
    originalRequests._retry = true

    if (!refreshTokenPromise) {
      refreshTokenPromise = refreshTokenAPI(

      ).then( data => {
        const newAccessToken = data?.accessToken
        
        // Update localStorage with new token
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken)
          
          // Update socket with new token
          try {
            updateSocketToken(newAccessToken)
          } catch (socketError) {
            console.warn('[Auth] Failed to update socket token:', socketError)
          }
        }
        
        return newAccessToken
      }
      ).catch(() => {
        // Refresh token failed, logout user
        axiosReduxStore.dispatch(logoutUserAPI(false))
        throw error
      }
      ).finally(() => {
        refreshTokenPromise = null
      }
      )
    }

    // eslint-disable-next-line no-unused-vars
    return refreshTokenPromise.then(accessToken => {
      return authorizeAxiosInstance(originalRequests)
    })
  }

  let errorMessage = 'An error occurred'
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message
  }
  else if (error.response?.data?.error) {
    errorMessage = error.response.data.error
  }
  else if (error.response?.status) {
    switch (error.response.status) {
    case 400:
      errorMessage = 'Bad request - Invalid data'
      break
    case 403:
      errorMessage = 'Access denied - You do not have permission'
      break
    case 404:
      errorMessage = 'Resource not found'
      break
    case 500:
      errorMessage = 'Server error - Please try again later'
      break
    default:
      errorMessage = `Request failed with status ${error.response.status}`
    }
  }
  else if (error.message) {
    errorMessage = error.message
  }

  if (error.response?.status !== 401 && error.response?.status !== 410) {
    toast.error(errorMessage)
  }

  console.error('API Error Details:', {
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    status: error.response?.status,
    statusText: error.response?.statusText,
    backendMessage: error.response?.data?.message,
    backendError: error.response?.data?.error,
    finalMessage: errorMessage,
    fullError: error.response?.data
  })
  return Promise.reject(error)
})

export default authorizeAxiosInstance