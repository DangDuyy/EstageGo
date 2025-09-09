import { toast } from 'react-toastify'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'

export const registerUserAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/register`, data)
  toast.success('Account created successfully! Please check your email to verify account')
  return response.data
}

export const verifyUserAPI = async (data) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/verify`, data)
  toast.success('Account verified successfully!')
  return response.data
}

export const refreshTokenAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/refresh_token`)
  return response.data
}

export const fetchAllPropertiesAPI = async (searchPath) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties${searchPath}`)
  return response.data
}