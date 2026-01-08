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

// Get current logged-in user's latest data from database
export const getCurrentUserAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/me`)
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
    {
      headers: {
        "Content-Type": "multipart/form-data",
      }
    }
  )
  return response.data
}

export const generateTitleDescription = async (formData) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/generateTitleDescription`, formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      }
    }
  )
  return response.data
}

export const verifyPropertyDocumentsAPI = async (formData) => {
  const response = await authorizeAxiosInstance.post(
    `${API_ROOT}/v1/properties/verify-documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  )
  return response.data
}

export const deletePropertyAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/properties/${propertyId}`)
  return response.data
}

// ==================== GoogleMap ============================
export const geocodeAddress = async (addr) => {
  // const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${import.meta.env.VITE_GOOGLE_MAP_API_KEY}`
  // const response = await authorizeAxiosInstance.get(url)
  // return response.data
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: addr }, (results, status) => {
      if (status === 'OK') resolve(results)
      else reject(status)
    })
  })
}

// ==================== Province API ============================
export const fetchPropertyDetail = async (propertyId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}`)
  return response.data
}

// export const getAllProvinces = async () => {
//   const response = await axios.get('https://provinces.open-api.vn/api/v1/p/')
//   return response.data
// }

export const getAllProvinces = async () => {
  const response = await axios.get(`${API_ROOT}/v1/api.vn/provinces`)
  return response.data.data
}

export const getProvince = async (provinceCode) => {
  const response = await axios.get(`${API_ROOT}/v1/api.vn/provinces/${provinceCode}/full`, {
    params: {
      depth: 3
    }
  })
  console.log("province: ", response.data)
  return response.data.data
}

export const getDistrict = async (provinceCode) => {
  const response = await axios.get(`https://open.oapi.vn/location/districts/${provinceCode}?page=0&size=300`, {
    params: {
      depth: 3
    }
  })
  return response.data.data
}

export const getWard = async (districtId) => {
  const response = await axios.get(`https://open.oapi.vn/location/wards/${districtId}?page=0&size=300`, {
    params: {
      depth: 3
    }
  })
  return response.data.data
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
  return response.data.user
}

// Change password
export const changePasswordAPI = async (passwordData) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/users/change-password`, passwordData)
  toast.success('Password changed successfully!')
  return response.data
}

// Get membership info from UserMembership model
export const getMembershipInfoAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/membership-info`)
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

// Get properties grouped by province with count and sample image
export const getPropertiesGroupedByProvinceAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/province-summary`)
  return response.data
}

// Request to become an agent
export const requestAgentRoleAPI = async () => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/agent-requests`)
  toast.success('Agent request submitted successfully!')
  return response.data.user || response.data
}

// Remove agent role and return to user
export const removeAgentRoleAPI = async () => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/users/remove-agent`)
  toast.success('Agent role removed successfully!')
  return response.data
}

// ==================== Agent Dashboard Stats ============================
export const getAgentDashboardStatsAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/agent/dashboard-stats`)
  return response.data
}

export const getListingStatsAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/users/me/listing-stats`)
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

// Send message (supports text-only or text + files)
export const sendMessageAPI = async (conversationId, payload, isFormData = false) => {
  // Backwards compatible: payload can be a plain text string
  if (!isFormData && (typeof payload === 'string' || typeof payload?.text === 'string')) {
    const text = typeof payload === 'string' ? payload : payload.text
    const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/messages`, {
      conversationId,
      text
    })
    return response.data
  }

  // Multipart/form-data with optional text + files
  const formData = payload instanceof FormData ? payload : new FormData()

  if (!(payload instanceof FormData)) {
    formData.append('conversationId', conversationId)
    if (payload?.text) formData.append('text', payload.text)
    if (Array.isArray(payload?.files)) {
      payload.files.forEach((file) => {
        if (file) formData.append('files', file)
      })
    }
  }

  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/messages`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Toggle reaction on a message
export const toggleReactionAPI = async (messageId, emoji) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/messages/${messageId}/reactions`, {
    emoji
  })
  return response.data
}

// Delete message for current user
export const deleteMessageForMeAPI = async (messageId) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/messages/${messageId}`)
  return response.data
}

// Recall message for everyone
export const recallMessageAPI = async (messageId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/messages/${messageId}/recall`)
  return response.data
}

// Get messages in conversation
export const getMessagesAPI = async (conversationId, page = 1, limit = 50) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/messages/${conversationId}`, {
    params: { page, limit }
  })
  return response.data
}

// Get conversation media by type (image, video, audio, file)
export const getConversationMediaAPI = async (conversationId, type = 'image', page = 1, limit = 12) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/messages/${conversationId}/media`, {
    params: { type, page, limit }
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
export const analyzePropertyImageAPI = async (propertyId, imageId, imageUrl = null) => {
  let url = `${API_ROOT}/v1/properties/${propertyId}/images/${imageId}/analyze`
  if (imageUrl) {
    url += `?imageUrl=${encodeURIComponent(imageUrl)}`
  }
  const response = await authorizeAxiosInstance.post(url)
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
  return response.data
}

// Verify phone with code (for profile update)
export const verifyPhoneAPI = async (phone, code) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/phone/verify`, { phone, code })
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

// ========== PAYMENT APIs ==========

// Create payment URL for deposit
export const createPaymentAPI = async (amount, bankCode = '') => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/payment/create`, {
    amount,
    bankCode
  })
  return response.data
}

// Get balance
export const getBalanceAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/payment/balance`)
  return response.data
}

// Get transaction history with enhanced filters
export const getTransactionHistoryAPI = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams()
  params.set('page', page)
  params.set('limit', limit)

  if (filters.status) params.set('status', filters.status)
  if (filters.type) params.set('type', filters.type)
  if (filters.transactionType) params.set('transactionType', filters.transactionType)
  if (filters.startDate) params.set('startDate', filters.startDate)
  if (filters.endDate) params.set('endDate', filters.endDate)

  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/payment/transactions?${params.toString()}`)
  return response.data
}

// Get transaction detail
export const getTransactionDetailAPI = async (transactionId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/payment/transactions/${transactionId}`)
  return response.data
}

// Get bank list supported by VNPay
export const getBankListAPI = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/payment/banks`)
  return response.data
}

// ========== NOTIFICATION APIs ==========

export const getNotificationsAPI = async (page = 1, limit = 20) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/notifications`, {
    params: { page, limit }
  })
  return response.data
}

export const markNotificationReadAPI = async (id) => {
  const response = await authorizeAxiosInstance.patch(`${API_ROOT}/v1/notifications/${id}/read`)
  return response.data
}

export const markAllNotificationsReadAPI = async () => {
  const response = await authorizeAxiosInstance.patch(`${API_ROOT}/v1/notifications/read-all`)
  return response.data
}

export const deleteNotificationAPI = async (id) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/notifications/${id}`)
  return response.data
}

export const deleteAllNotificationsAPI = async () => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/notifications/all/clear`)
  return response.data
}

// ========== AGENT REVIEW APIs ==========

// Get all recent reviews for homepage
export const getAllRecentReviewsAPI = async (limit = 6) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-reviews`, {
    params: { limit }
  })
  return response.data
}

// Get all reviews for an agent
export const getAgentReviewsAPI = async (agentId, page = 1, limit = 10) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-reviews/agent/${agentId}`, {
    params: { page, limit }
  })
  return response.data
}

// Get single review by ID
export const getReviewByIdAPI = async (reviewId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-reviews/review/${reviewId}`)
  return response.data
}

// Get user's review for an agent
export const getUserReviewForAgentAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-reviews/user/${agentId}`)
  return response.data
}

// Create a review
export const createAgentReviewAPI = async (agentId, { rating, comment, media = [] }) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/agent-reviews/${agentId}`, {
    rating,
    comment,
    media
  })
  toast.success('Review submitted successfully!')
  return response.data
}

// Update a review
export const updateAgentReviewAPI = async (reviewId, { rating, comment, media }) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/agent-reviews/${reviewId}`, {
    rating,
    comment,
    media
  })
  toast.success('Review updated successfully!')
  return response.data
}

// Delete a review
export const deleteAgentReviewAPI = async (reviewId) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/agent-reviews/${reviewId}`)
  toast.success('Review deleted successfully!')
  return response.data
}

// ========== AGENT FOLLOW APIs ==========

// Get all followers for an agent
export const getAgentFollowersAPI = async (agentId, page = 1, limit = 20) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-follows/followers/${agentId}`, {
    params: { page, limit }
  })
  return response.data
}

// Get all agents user is following
export const getUserFollowingAPI = async (page = 1, limit = 20) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-follows/following`, {
    params: { page, limit }
  })
  return response.data
}

// Get all agents an agent is following
export const getAgentFollowingAPI = async (agentId, page = 1, limit = 20) => {
  const response = await axios.get(`${API_ROOT}/v1/agent-follows/following-list/${agentId}`, {
    params: { page, limit }
  })
  return response.data
}

// Check if user is following an agent
export const checkFollowingAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-follows/check/${agentId}`)
  return response.data
}

// Follow an agent
export const followAgentAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/agent-follows/${agentId}`)
  toast.success('Successfully followed agent!')
  return response.data
}

// Unfollow an agent
export const unfollowAgentAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.delete(`${API_ROOT}/v1/agent-follows/${agentId}`)
  toast.success('Successfully unfollowed agent!')
  return response.data
}

// Toggle follow (follow/unfollow)
export const toggleFollowAgentAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/agent-follows/toggle/${agentId}`)
  return response.data
}

// Get follow statistics for an agent
export const getAgentFollowStatsAPI = async (agentId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/agent-follows/stats/${agentId}`)
  return response.data
}

// ========== PROPERTY UPDATE APIs ==========

// Update property
export const updatePropertyAPI = async (propertyId, propertyData) => {
  // Check if propertyData is FormData
  const isFormData = propertyData instanceof FormData
  
  const response = await authorizeAxiosInstance.put(
    `${API_ROOT}/v1/properties/${propertyId}`, 
    propertyData,
    isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : undefined
  )
  toast.success('Property updated successfully!')
  return response.data
}

// Update property status (active/draft/archived)
export const updatePropertyStatusAPI = async (propertyId, status) => {
  const response = await authorizeAxiosInstance.patch(`${API_ROOT}/v1/properties/${propertyId}/status`, { status })
  return response.data
}

// Update property visibility (public/private)
export const updatePropertyVisibilityAPI = async (propertyId, visibility) => {
  const response = await authorizeAxiosInstance.patch(`${API_ROOT}/v1/properties/${propertyId}/visibility`, { visibility })
  return response.data
}
// ========== BOOST/BUMP APIs ==========

// Boost a single property
export const boostPropertyAPI = async (propertyId, useCredits = false, durationHours) => {
  const payload = { useCredits }
  if (durationHours) payload.durationHours = durationHours
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/${propertyId}/boost`, payload)
  toast.success('Property boosted successfully!')
  return response.data
}

// Get property statistics (views, contacts, shares, likes)
export const getPropertyStatisticsAPI = async (propertyId) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/properties/${propertyId}/statistics`)
  return response.data
}

// Boost multiple properties
export const boostMultiplePropertiesAPI = async (propertyIds) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/boost/batch`, {
    propertyIds
  })
  toast.success(`${propertyIds.length} properties boosted successfully!`)
  return response.data
}

// Purchase boost package
export const purchaseBoostPackageAPI = async (packageType) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/properties/boost/purchase-package`, {
    packageType
  })
  toast.success('Boost package purchased successfully!')
  return response.data
}

// ==================================
// Listing Tier
// ==================================
export const getListingTiers = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/listingTier`)
  return response.data
}

// ==================================
// Membership Config
// ==================================
export const getMembershipConfigs = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/membershipConfig`)
  return response.data
}

export const getMembershipConfigUsageStats = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/membershipConfig/stats/usage`)
  return response.data
}

export const getMembershipUsers = async (type) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/membershipConfig/${type}/users`)
  return response.data
}

export const updateMembershipConfig = async (type, data) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/membershipConfig/${type}`, data)
  return response.data
}

export const updateMembershipPricing = async (type, pricingData) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/membershipConfig/${type}/pricing`, pricingData)
  return response.data
}

export const getListingTierUsageStats = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/listingTier/stats/usage`)
  return response.data
}

export const getListingTierProperties = async (tierName) => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/listingTier/${tierName}/properties`)
  return response.data
}

export const updateListingTier = async (tierName, data) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/listingTier/${tierName}`, data)
  return response.data
}

export const updateListingTierPricing = async (tierName, pricingData) => {
  const response = await authorizeAxiosInstance.put(`${API_ROOT}/v1/listingTier/${tierName}/pricing`, pricingData)
  return response.data
}

// ==================================
// User Membership
// ==================================
export const subscribe = async (membershipType) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/membership/subscribe`, { membershipType })
  return response.data
}

export const getActiveMembership = async () => {
  const response = await authorizeAxiosInstance.get(`${API_ROOT}/v1/membership/active`)
  return response.data
}

// ==================================
// Documentation
// ==================================
export const getDocuments = async (query) =>
  (await authorizeAxiosInstance.get(`${API_ROOT}/v1/documents`, { params: query })).data

export const createDocument = async (payload) =>
  (await authorizeAxiosInstance.post(`${API_ROOT}/v1/documents`, payload)).data

export const updateDocument = async (id, payload) =>
  (await authorizeAxiosInstance.put(`${API_ROOT}/v1/documents/${id}`, payload)).data

export const deleteDocument = async (id, hard) =>
  (await authorizeAxiosInstance.delete(`${API_ROOT}/v1/documents/${id}?hard=${hard}`)).data

export const rebuildDocument = async () =>
  (await authorizeAxiosInstance.post(`${API_ROOT}/v1/documents/rebuild-index`)).data

// ==================== Forgot Password ============================
export const requestForgotPasswordAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password`, data)
  return response.data
}

export const verifyResetCodeAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/verify-reset-code`, data)
  return response.data
}

export const resetPasswordAPI = async (data) => {
  const response = await authorizeAxiosInstance.post(`${API_ROOT}/v1/users/reset-password`, data)
  return response.data
}
