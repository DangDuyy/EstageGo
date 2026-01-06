import { pick } from 'lodash'

export const pickUser = (user) => {
  if (!user) return {}
  return pick(user, [
    '_id', 'email', 'userName', 'fullName', 'avatar', 'phone', 'gender', 'address', 'dob', 'role', 'isActive', 'createdAt', 'updatedAt',
    // Presence
    'isOnline', 'lastActiveAt',
    // Agent fields
    'companyName', 'agentTitle', 'bio', 'experience', 'supportServices', 'operatingAreas', 'licenseNumber', 'website', 'socialLinks', 
    // Broker page
    'brokerPage',
    // Membership fields
    'agentRequestStatus',
    // Account fields
    'balance', 'boostCredits', 'isEmailVerified', 'isPhoneVerified'
  ])
}

export const slugify = (val) => {
  if (!val) return ''
  return String(val)
    .normalize('NFKD') // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // remove consecutive hyphens
}

export const escapeRegex = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")


export const toArr = (v) => Array.isArray(v) ? v : (v != null ? [v] : [])
export const toNum = (v) => (v !== undefined ? Number(v) : undefined)
export const toStr = (v) => (v !== undefined ? String(v).trim() : undefined)

// ============ FUZZY SEARCH UTILITIES ============

/**
 * Remove Vietnamese diacritics from string
 * "Điện Biên Phủ" -> "Dien Bien Phu"
 */
export const removeDiacritics = (str) => {
  if (!str) return ''
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns number of edits needed to transform str1 to str2
 */
export const levenshteinDistance = (str1, str2) => {
  const s1 = String(str1).toLowerCase()
  const s2 = String(str2).toLowerCase()
  
  const m = s1.length
  const n = s2.length
  
  if (m === 0) return n
  if (n === 0) return m
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  return dp[m][n]
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * 1 = identical, 0 = completely different
 */
export const stringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0
  
  const s1 = removeDiacritics(str1.toLowerCase().trim())
  const s2 = removeDiacritics(str2.toLowerCase().trim())
  
  if (s1 === s2) return 1
  
  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 1
  
  const distance = levenshteinDistance(s1, s2)
  return 1 - (distance / maxLen)
}

/**
 * Find similar terms from a list of candidates
 * Returns array of { term, similarity } sorted by similarity
 */
export const findSimilarTerms = (query, candidates, threshold = 0.6) => {
  if (!query || !candidates || candidates.length === 0) return []
  
  const results = candidates
    .map(candidate => ({
      term: candidate,
      similarity: stringSimilarity(query, candidate)
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
  
  return results
}

/**
 * Check if query matches term with fuzzy logic
 * Returns true if similarity is above threshold
 */
export const fuzzyMatch = (query, term, threshold = 0.7) => {
  return stringSimilarity(query, term) >= threshold
}

/**
 * Create MongoDB regex for fuzzy search
 * Supports both exact and diacritic-insensitive search
 */
export const createFuzzyRegex = (query) => {
  if (!query) return null
  
  const normalized = removeDiacritics(query.trim())
  const escaped = escapeRegex(normalized)
  
  // Create pattern that matches both with and without diacritics
  return {
    $regex: escaped,
    $options: 'i'
  }
}