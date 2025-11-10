import { toast } from 'react-toastify'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'
import axios from 'axios'

export const sendVerificationCodeAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/send-code`, data)
  return response.data
}

export const verifyCodeAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/verify-code`, data)
  return response.data
}

export const registerUserAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/register`, data)
  toast.success('Account created successfully! Please check your email to verify account')
  return response.data
}

export const verifyUserAPI = async (data) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/verify`, data)
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

export const searchPropertiesAPI = async (filters) => {
  const params = new URLSearchParams()
  
  // Pagination
  if (filters.page) params.set('page', filters.page)
  if (filters.itemsPerPage) params.set('itemsPerPage', filters.itemsPerPage)
  
  // Search keyword
  if (filters.q) params.set('q', filters.q)
  
  // Types (array)
  if (filters.types && filters.types.length > 0) {
    filters.types.forEach(t => params.append('types', t))
  }
  
  // Location
  if (filters.province) params.set('province', filters.province)
  if (filters.provinces && filters.provinces.length > 0) {
    filters.provinces.forEach(p => params.append('provinces', p))
  }
  if (filters.district) params.set('district', filters.district)
  if (filters.ward) params.set('ward', filters.ward)
  
  // Purpose & status
  if (filters.purpose) params.set('purpose', filters.purpose)
  if (filters.status) params.set('status', filters.status)
  
  // Bedrooms
  if (filters.bedrooms !== undefined) params.set('bedrooms', filters.bedrooms)
  if (filters.bedroomsMin !== undefined) params.set('bedroomsMin', filters.bedroomsMin)
  if (filters.bedroomsMax !== undefined) params.set('bedroomsMax', filters.bedroomsMax)
  
  // Bathrooms
  if (filters.bathrooms !== undefined) params.set('bathrooms', filters.bathrooms)
  if (filters.bathroomsMin !== undefined) params.set('bathroomsMin', filters.bathroomsMin)
  if (filters.bathroomsMax !== undefined) params.set('bathroomsMax', filters.bathroomsMax)
  
  // Area
  if (filters.area !== undefined) params.set('area', filters.area)
  if (filters.areaMin !== undefined) params.set('areaMin', filters.areaMin)
  if (filters.areaMax !== undefined) params.set('areaMax', filters.areaMax)
  
  // Price
  if (filters.price !== undefined) params.set('price', filters.price)
  if (filters.priceMin !== undefined) params.set('priceMin', filters.priceMin)
  if (filters.priceMax !== undefined) params.set('priceMax', filters.priceMax)
  
  // Amenities
  if (filters.amenitiesAll && filters.amenitiesAll.length > 0) {
    filters.amenitiesAll.forEach(a => params.append('amenitiesAll', a))
  }
  if (filters.amenitiesAny && filters.amenitiesAny.length > 0) {
    filters.amenitiesAny.forEach(a => params.append('amenitiesAny', a))
  }
  
  // Owner
  if (filters.owner) params.set('owner', filters.owner)
  
  // Sort
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortDir) params.set('sortDir', filters.sortDir)
  
  const queryString = params.toString()
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties${queryString ? '?' + queryString : ''}`)
  return response.data
}