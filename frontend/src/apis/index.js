import { toast } from 'react-toastify'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'
import axios from 'axios'
import { polygon } from 'leaflet'

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
  return response.data
}

export const verifyUserAPI = async (data) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/verify`, data)
  return response.data
}

export const verifyPhoneRegistrationAPI = async (phone, code) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/phone/verify-registration`, { phone, code })
  return response.data
}

export const loginUserAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/login`, data)
  return response.data
}

export const logoutUserAPI = async () => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/users/logout`)
  localStorage.removeItem('accessToken')
  toast.success('Logged out successfully')
  return response.data
}

export const refreshTokenAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/refresh-token`)
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

export const getPropertiesWithinPolygon = async (polygon) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/in`, { polygon })
  return response.data
}

export const getPropertiesWithMap = async (query) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/map`, {
    params: query
  })

  return response.data
}

export const nlSearchPropertiesAPI = async (naturalLanguageQuery) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/nl-search`, { naturalLanguageQuery })
  return response.data
}

// ========== WISHLIST APIs ==========

// Get user's wishlist
export const getWishlistAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/wishlist`)
  return response.data
}

// Toggle property in wishlist (add if not exists, remove if exists)
export const toggleWishlistAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/wishlist/toggle`, { propertyId })
  return response.data
}

// Add property to wishlist
export const addToWishlistAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/wishlist`, { propertyId })
  return response.data
}

// Remove property from wishlist
export const removeFromWishlistAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/wishlist/${propertyId}`)
  return response.data
}

// Check if property is in wishlist
export const checkWishlistAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/wishlist/check/${propertyId}`)
  return response.data
}

// Clear all items from wishlist
export const clearAllWishlistAPI = async () => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/wishlist`)
  return response.data
}

// ========== USER PROFILE APIs ==========

// Update user profile
export const updateUserProfileAPI = async (profileData) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/profile`, profileData)
  toast.success('Profile updated successfully!')
  return response.data
}

// Change password
export const changePasswordAPI = async (passwordData) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/change-password`, passwordData)
  toast.success('Password changed successfully!')
  return response.data
}

// ========== AGENT APIs ==========

// Get all agents with search and pagination
export const getAllAgentsAPI = async (searchQuery = '', page = 1, limit = 12) => {
  const params = new URLSearchParams()
  if (searchQuery) params.set('search', searchQuery)
  params.set('page', page)
  params.set('limit', limit)
  
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/agents?${params.toString()}`)
  return response.data
}

// Get agent by ID
export const getAgentByIdAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/agents/${agentId}`)
  return response.data
}

// Request to become an agent
export const requestAgentRoleAPI = async () => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/request-agent`)
  toast.success('Agent request submitted successfully!')
  return response.data
}

// Remove agent role and return to user
export const removeAgentRoleAPI = async () => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/users/remove-agent`)
  toast.success('Agent role removed successfully!')
  return response.data
}

// ========== CONVERSATION APIs ==========

// Get all conversations for current user
export const getConversationsAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/conversations`)
  return response.data
}

// Create or get conversation with another user
export const createOrGetConversationAPI = async (otherUserId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/conversations`, { otherUserId })
  return response.data
}

// Get conversation by ID
export const getConversationByIdAPI = async (conversationId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/conversations/${conversationId}`)
  return response.data
}

// ========== MESSAGE APIs ==========

// Send message
export const sendMessageAPI = async (conversationId, text) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/messages`, {
    conversationId,
    text
  })
  return response.data
}

// Get messages in conversation
export const getMessagesAPI = async (conversationId, page = 1, limit = 50) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/messages/${conversationId}`, {
    params: { page, limit }
  })
  return response.data
}

// ========== IMAGE TAGGING APIs ==========

// Get user properties with media
export const getUserPropertiesWithMediaAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/user/properties-with-media`)
  return response.data
}

// Get all user image tags
export const getAllUserImageTagsAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/user/image-tags`)
  return response.data
}

// Search properties by tag
export const searchPropertiesByTagAPI = async (tag, page = 1, limit = 12) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/search-by-tag`, {
    params: { tag, page, limit }
  })
  return response.data
}

// Analyze single image
export const analyzePropertyImageAPI = async (propertyId, imageId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/${propertyId}/images/${imageId}/analyze`)
  return response.data
}

// Update image tags
export const updateImageTagsAPI = async (propertyId, imageId, tags, detectedObjects) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/properties/${propertyId}/images/${imageId}/tags`, {
    tags,
    detectedObjects
  })
  return response.data
}

// Bulk analyze all images of a property
export const bulkAnalyzeImagesAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/${propertyId}/images/bulk-analyze`)
  toast.success('Images analyzed successfully!')
  return response.data
}

// Analyze temporary image (not attached to property)
export const analyzeTemporaryImageAPI = async (file) => {
  const formData = new FormData()
  formData.append('files', file)
  
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/analyze-temp-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Clear all tags from an image
export const clearImageTagsAPI = async (propertyId, imageId) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/properties/${propertyId}/images/${imageId}/tags`)
  toast.success('Tags cleared successfully!')
  return response.data
}
// Send phone verification code (for profile update)
export const sendPhoneVerificationAPI = async (phone) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/phone/send-code`, { phone })
  toast.success('Verification code sent to your phone!')
  return response.data
}

// Verify phone with code (for profile update)
export const verifyPhoneAPI = async (phone, code) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/phone/verify`, { phone, code })
  toast.success('Phone verified successfully!')
  return response.data
}

// ========== RECOMMENDATION APIs ==========
// These APIs support User-Based Collaborative Filtering (CF) algorithm
// The backend builds a User-Property Preference Matrix from UserActivity events:
// - WISHLIST_ADD: weight 5 (highest preference)
// - CONTACT: weight 3 (serious interest)
// - VIEW (>10s): weight 1 (low interest)
// Then uses Cosine Similarity to find similar users and weighted sum for predictions

// Get personalized recommendations using Collaborative Filtering
// Returns properties recommended by users with similar preferences
export const getPersonalizedRecommendationsAPI = async (limit = 10) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/recommendations/personalized`, {
    params: { limit }
  })
  return response.data
}

// Get similar properties based on a specific property
export const getSimilarPropertiesAPI = async (propertyId, limit = 6) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/recommendations/similar/${propertyId}`, {
    params: { limit }
  })
  return response.data
}

// Track user activity for Collaborative Filtering
// eventType can be: 'WISHLIST_ADD' (weight 5), 'CONTACT' (weight 3), 'VIEW' (weight 1, only if duration >= 10s)
// This builds the User-Property Preference Matrix used in CF algorithm
export const trackActivityAPI = async (eventType, propertyId = null, metadata = {}) => {
  try {
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/recommendations/track`, {
      eventType,
      propertyId,
      metadata,
      sessionId: getOrCreateSessionId()
    })
    return response.data
  } catch (error) {
    // Silent fail for tracking - don't interrupt user experience
    console.warn('Failed to track activity:', error)
    return null
  }
}

// Get user activity history (for debugging)
export const getUserActivityHistoryAPI = async (limit = 50) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/recommendations/history`, {
    params: { limit }
  })
  return response.data
}

// Helper function to get or create session ID
const getOrCreateSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

// ========== CHATBOT APIs ==========
export const sendMessageToChatBotAPI = async (sender, message) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/chatbot`, { sender, message })
  return response.data
}