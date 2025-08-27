/* eslint-disable no-console */
import axios from 'axios'
import { refreshTokenAPI } from '@/apis'
import { logoutUserAPI } from '@/redux/user/userSlice'
import { interceptorLoadingElements } from './formatters'
import { toast } from 'react-toastify'

let axiosReduxStore
export const injectStore = mainStore => {
  axiosReduxStore = mainStore
}

const authorizeAxiosInstance = axios.create()

authorizeAxiosInstance.defaults.timeout = 1000 * 60 * 10

authorizeAxiosInstance.defaults.withCredentials = true

authorizeAxiosInstance.interceptors.request.use((config) => {
  interceptorLoadingElements(true)
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

  if (error.response?.status === 401) {
    axiosReduxStore.dispatch(logoutUserAPI(false))
  }

  const originalRequests = error.config
  if (error.response?.status === 410 && !originalRequests._retry) {
    originalRequests._retry = true

    if (!refreshTokenPromise) {
      refreshTokenPromise = refreshTokenAPI(

      ).then( data => {
        return data?.accessToken
      }
      ).catch(() => {
        axiosReduxStore.dispatch(logoutUserAPI(false))
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