import { toast } from 'react-toastify'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'
import axios from 'axios'

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
  console.log(response.data)
  return response.data
}

// ==================== Property ============================
export const createProperty = async (formData) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties`, formData,
    {headers: {
      "Content-Type": "multipart/form-data",
    }}
  )
  return response.data
}


// ==================== GoogleMap ============================
export const geocodeAddress = async (addr) => {
  // const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`
  // const response = await authorizeAxiosInstance.get(url)
  // return response.data
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({address: addr}, (results, status) => {
      if(status === 'OK') resolve(results)
        else reject(status)
    })
  })
}

// ==================== Province API ============================
export const getAllProvinces = async () => {
  const response = await axios.get('https://provinces.open-api.vn/api/v1/p/')
  return response.data
}

export const getProvince = async (provinceCode) => {
  const response = await axios.get(`https://provinces.open-api.vn/api/v1/p/${provinceCode}`, {
    params: {
      depth: 3
    }
  })
  console.log("province: ", response.data)
  return response.data
}