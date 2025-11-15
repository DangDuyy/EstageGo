import { findSimilarTerms, removeDiacritics } from '~/utils/formatter'

const { default: propertyModel } = require('~/models/properties')

/**
 * Get common search terms from database for suggestions
 */
export const getCommonSearchTerms = async () => {
  try {
    // Lấy các terms phổ biến từ database
    const properties = await propertyModel.find(
      { _destroy: { $ne: true } },
      { 
        'address.province': 1, 
        'address.district': 1, 
        'address.ward': 1,
        'address.fullAddress': 1,
        'amenities': 1,
        'type': 1,
        'title': 1,
        'description': 1
      }
    ).limit(1000).lean()

    const terms = new Set()

    properties.forEach(prop => {
      // Địa chỉ
      if (prop.address?.province) terms.add(prop.address.province)
      if (prop.address?.district) terms.add(prop.address.district)
      if (prop.address?.ward) terms.add(prop.address.ward)
      
      // Amenities
      if (Array.isArray(prop.amenities)) {
        prop.amenities.forEach(a => terms.add(a))
      }
      
      // Extract keywords from fullAddress
      if (prop.address?.fullAddress) {
        const words = prop.address.fullAddress.split(/[\s,]+/).filter(w => w.length > 2)
        words.forEach(w => terms.add(w))
      }
      
      // Extract từ title và description
      if (prop.title) {
        const words = prop.title.split(/[\s,]+/).filter(w => w.length > 3)
        words.slice(0, 5).forEach(w => terms.add(w))
      }
    })

    return Array.from(terms)
  } catch (error) {
    console.error('Error getting common search terms:', error)
    return []
  }
}

/**
 * Cache for common terms (refresh mỗi 1 giờ)
 */
let termsCache = null
let lastCacheUpdate = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export const getCachedCommonTerms = async () => {
  const now = Date.now()
  if (!termsCache || !lastCacheUpdate || (now - lastCacheUpdate) > CACHE_TTL) {
    termsCache = await getCommonSearchTerms()
    lastCacheUpdate = now
  }
  return termsCache
}

/**
 * Popular fallback suggestions when no match found
 */
const POPULAR_SUGGESTIONS = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Quận 1',
  'Quận 7',
  'Bình Thạnh',
  'Căn hộ cho thuê',
  'Nhà phố bán',
  'Gần trường học',
  'Gần chợ'
]

/**
 * Find suggestions for a search query
 * Returns { didYouMean: string | null, suggestions: string[] }
 */
export const findSearchSuggestions = async (query, maxSuggestions = 5) => {
  if (!query || query.trim().length < 2) {
    return { didYouMean: null, suggestions: [] }
  }

  const commonTerms = await getCachedCommonTerms()
  
  // Nếu cache rỗng, dùng popular suggestions
  const termsToSearch = commonTerms.length > 0 ? commonTerms : POPULAR_SUGGESTIONS
  
  const similarTerms = findSimilarTerms(query, termsToSearch, 0.5) // threshold 0.5 để dễ suggest hơn

  // Nếu không tìm thấy similar terms và threshold cao, thử lại với threshold thấp hơn
  if (similarTerms.length === 0) {
    const relaxedTerms = findSimilarTerms(query, termsToSearch, 0.3)
    if (relaxedTerms.length > 0) {
      return { 
        didYouMean: null, 
        suggestions: relaxedTerms.slice(0, maxSuggestions).map(item => item.term) 
      }
    }
    
    // Vẫn không có gì, trả về popular suggestions
    return { 
      didYouMean: null, 
      suggestions: POPULAR_SUGGESTIONS.slice(0, maxSuggestions) 
    }
  }

  // Nếu best match có similarity > 0.7 và khác với query -> did you mean
  const bestMatch = similarTerms[0]
  const queryNormalized = removeDiacritics(query.toLowerCase().trim())
  const bestNormalized = removeDiacritics(bestMatch.term.toLowerCase().trim())
  
  let didYouMean = null
  if (bestMatch.similarity >= 0.7 && queryNormalized !== bestNormalized) {
    didYouMean = bestMatch.term
  }

  // Top suggestions
  const suggestions = similarTerms
    .slice(0, maxSuggestions)
    .map(item => item.term)

  return { didYouMean, suggestions }
}

/**
 * Extract location keywords from natural language query
 */
export const extractLocationKeywords = (query) => {
  if (!query) return []
  
  const keywords = []
  const lowerQuery = query.toLowerCase()
  
  // Common location indicators
  const locationIndicators = [
    'quận', 'huyện', 'phường', 'xã', 'thành phố', 'tp', 
    'district', 'ward', 'city', 'near', 'gần', 'khu vực', 'tại'
  ]
  
  locationIndicators.forEach(indicator => {
    const regex = new RegExp(`${indicator}\\s+([\\wÀ-ỹ\\s]+?)(?:,|\\.|$|\\s+và|\\s+hoặc)`, 'gi')
    const matches = lowerQuery.matchAll(regex)
    for (const match of matches) {
      if (match[1]) {
        keywords.push(match[1].trim())
      }
    }
  })
  
  return keywords
}

export const searchSuggestionService = {
  getCommonSearchTerms,
  getCachedCommonTerms,
  findSearchSuggestions,
  extractLocationKeywords
}
