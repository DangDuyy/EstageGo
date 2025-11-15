const { default: propertyModel } = require('~/models/properties')

/**
 * Extract keywords from text (Vietnamese & English)
 */
const extractKeywords = (text) => {
  if (!text) return []
  const words = text.toLowerCase()
    .replace(/[^\wàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && w.length < 20)
  return words
}

/**
 * Extract knowledge base from database for AI context
 * This helps AI understand what data exists in our database
 */
export const getPropertyKnowledge = async () => {
  try {
    // Get comprehensive data for AI understanding
    const [
      uniqueProvinces,
      uniqueDistricts,
      uniqueTypes,
      uniqueAmenities,
      priceStats,
      areaStats,
      roomStats,
      yearBuiltStats,
      statusDistribution,
      purposeDistribution,
      sampleProperties
    ] = await Promise.all([
      // Unique provinces
      propertyModel.distinct('address.province', { _destroy: { $ne: true } }),
      
      // Unique districts (top 20)
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true } } },
        { $group: { _id: '$address.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { _id: 1 } }
      ]),
      
      // Property types
      propertyModel.distinct('type', { _destroy: { $ne: true } }),
      
      // Common amenities
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true } } },
        { $unwind: '$amenities' },
        { $group: { _id: '$amenities', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      ]),
      
      // Price statistics
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true }, 'price.value': { $gt: 0 } } },
        { $group: {
            _id: null,
            minPrice: { $min: '$price.value' },
            maxPrice: { $max: '$price.value' },
            avgPrice: { $avg: '$price.value' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Area statistics
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true }, area: { $gt: 0 } } },
        { $group: {
            _id: null,
            minArea: { $min: '$area' },
            maxArea: { $max: '$area' },
            avgArea: { $avg: '$area' }
          }
        }
      ]),
      
      // Room statistics (bedrooms, bathrooms)
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true } } },
        { $group: {
            _id: null,
            minBedrooms: { $min: '$rooms.bedrooms' },
            maxBedrooms: { $max: '$rooms.bedrooms' },
            avgBedrooms: { $avg: '$rooms.bedrooms' },
            minBathrooms: { $min: '$rooms.bathrooms' },
            maxBathrooms: { $max: '$rooms.bathrooms' },
            avgBathrooms: { $avg: '$rooms.bathrooms' }
          }
        }
      ]),
      
      // Year built statistics
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true }, yearBuilt: { $exists: true, $ne: null } } },
        { $group: {
            _id: null,
            minYear: { $min: '$yearBuilt' },
            maxYear: { $max: '$yearBuilt' },
            avgYear: { $avg: '$yearBuilt' }
          }
        }
      ]),
      
      // Status distribution
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Purpose distribution (sale vs rent)
      propertyModel.aggregate([
        { $match: { _destroy: { $ne: true } } },
        { $group: { _id: '$purpose', count: { $sum: 1 } } }
      ]),
      
      // Sample properties to extract building names, keywords from description
      propertyModel.find(
        { _destroy: { $ne: true } },
        { 
          'address.fullAddress': 1, 
          'title': 1, 
          'description': 1,
          'type': 1,
          'purpose': 1,
          'price.value': 1,
          'area': 1,
          'createdAt': 1
        }
      ).limit(200).lean()
    ])

    // Extract building names, keywords from descriptions
    const buildingKeywords = new Set()
    const descriptionKeywords = {}
    
    sampleProperties.forEach(prop => {
      // Extract từ fullAddress
      if (prop.address?.fullAddress) {
        const addr = prop.address.fullAddress.toLowerCase()
        
        // Common building/complex patterns
        const buildingPatterns = [
          /(?:tòa|toà|tower|building)\s+([a-z0-9\s]+)/gi,
          /(?:chung\s*cư|căn\s*hộ|khu\s*đô\s*thị)\s+([a-zà-ỹ0-9\s]+)/gi,
          /(?:vinhomes|vincom|landmark|masteri|saigon\s*pearl|the\s*manor)/gi,
          /(?:sunrise|sunset|diamond|pearl|green\s*valley|sun\s*avenue)/gi
        ]
        
        buildingPatterns.forEach(pattern => {
          const matches = addr.matchAll(pattern)
          for (const match of matches) {
            const keyword = (match[1] || match[0]).trim()
            if (keyword.length > 3 && keyword.length < 30) {
              buildingKeywords.add(keyword)
            }
          }
        })
      }
      
      // Extract từ title
      if (prop.title) {
        const title = prop.title.toLowerCase()
        const buildingPatterns = /(?:vinhomes|vincom|landmark|masteri|saigon\s*pearl|the\s*manor|sunrise|sunset|diamond)/gi
        const matches = title.matchAll(buildingPatterns)
        for (const match of matches) {
          buildingKeywords.add(match[0].trim())
        }
      }
      
      // Extract keywords từ description
      if (prop.description) {
        const words = extractKeywords(prop.description)
        words.forEach(word => {
          descriptionKeywords[word] = (descriptionKeywords[word] || 0) + 1
        })
      }
    })
    
    // Get top keywords from descriptions (filter common words)
    const commonStopWords = ['căn', 'hộ', 'nhà', 'phòng', 'bán', 'thuê', 'cho', 'cần', 'tìm', 'với', 'của', 'trong', 'ngoài', 'trên', 'dưới', 'này', 'đó']
    const topDescriptionKeywords = Object.entries(descriptionKeywords)
      .filter(([word]) => !commonStopWords.includes(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word]) => word)

    // Format statistics
    const priceStatsFormatted = priceStats[0] || {}
    const areaStatsFormatted = areaStats[0] || {}
    const roomStatsFormatted = roomStats[0] || {}
    const yearBuiltFormatted = yearBuiltStats[0] || {}

    return {
      provinces: uniqueProvinces.filter(Boolean),
      districts: uniqueDistricts.map(d => d._id).filter(Boolean),
      propertyTypes: uniqueTypes.filter(Boolean),
      amenities: uniqueAmenities.map(a => a._id).filter(Boolean),
      buildingNames: Array.from(buildingKeywords).slice(0, 30),
      descriptionKeywords: topDescriptionKeywords,
      
      // Price ranges
      priceRange: {
        min: priceStatsFormatted.minPrice || 0,
        max: priceStatsFormatted.maxPrice || 0,
        avg: Math.round(priceStatsFormatted.avgPrice || 0)
      },
      
      // Area ranges
      areaRange: {
        min: areaStatsFormatted.minArea || 0,
        max: areaStatsFormatted.maxArea || 0,
        avg: Math.round(areaStatsFormatted.avgArea || 0)
      },
      
      // Room ranges
      roomRanges: {
        bedrooms: {
          min: roomStatsFormatted.minBedrooms || 0,
          max: roomStatsFormatted.maxBedrooms || 0,
          avg: Math.round(roomStatsFormatted.avgBedrooms || 0)
        },
        bathrooms: {
          min: roomStatsFormatted.minBathrooms || 0,
          max: roomStatsFormatted.maxBathrooms || 0,
          avg: Math.round(roomStatsFormatted.avgBathrooms || 0)
        }
      },
      
      // Year built range
      yearBuiltRange: {
        min: yearBuiltFormatted.minYear || null,
        max: yearBuiltFormatted.maxYear || null,
        avg: Math.round(yearBuiltFormatted.avgYear || 0)
      },
      
      // Status & Purpose distributions
      statusDistribution: statusDistribution.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      
      purposeDistribution: purposeDistribution.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      
      // Summary for prompt
      summary: {
        totalProvinces: uniqueProvinces.length,
        totalDistricts: uniqueDistricts.length,
        commonBuildings: Array.from(buildingKeywords).slice(0, 10).join(', '),
        priceRange: `${(priceStatsFormatted.minPrice || 0).toLocaleString()} - ${(priceStatsFormatted.maxPrice || 0).toLocaleString()} VND`,
        areaRange: `${areaStatsFormatted.minArea || 0} - ${areaStatsFormatted.maxArea || 0} m²`,
        commonKeywords: topDescriptionKeywords.slice(0, 15).join(', ')
      }
    }
  } catch (error) {
    console.error('Error getting property knowledge:', error)
    return null
  }
}

/**
 * Format knowledge base for AI prompt
 */
export const formatKnowledgeForPrompt = (knowledge) => {
  if (!knowledge) return ''
  
  return `
═══════════════════════════════════════════════════════════════
THÔNG TIN VỀ DỮ LIỆU BẤT ĐỘNG SẢN TRONG DATABASE
(AI hãy sử dụng thông tin này để hiểu rõ data có sẵn và tạo query chính xác)
═══════════════════════════════════════════════════════════════

📍 ĐỊA ĐIỂM:
Tỉnh/Thành phố (${knowledge.provinces.length} locations):
${knowledge.provinces.join(', ')}

Quận/Huyện phổ biến (${knowledge.districts.length} districts):
${knowledge.districts.slice(0, 20).join(', ')}

🏢 TÒA NHÀ/KHU ĐÔ THỊ PHỔ BIẾN:
${knowledge.buildingNames.join(', ')}

💰 PHẠM VI GIÁ:
- Thấp nhất: ${knowledge.priceRange.min.toLocaleString()} VND
- Cao nhất: ${knowledge.priceRange.max.toLocaleString()} VND
- Trung bình: ${knowledge.priceRange.avg.toLocaleString()} VND

📐 PHẠM VI DIỆN TÍCH:
- Nhỏ nhất: ${knowledge.areaRange.min} m²
- Lớn nhất: ${knowledge.areaRange.max} m²
- Trung bình: ${knowledge.areaRange.avg} m²

🛏️ PHÒNG NGỦ:
- Range: ${knowledge.roomRanges.bedrooms.min} - ${knowledge.roomRanges.bedrooms.max} phòng
- Phổ biến: ~${knowledge.roomRanges.bedrooms.avg} phòng

🚿 PHÒNG TẮM:
- Range: ${knowledge.roomRanges.bathrooms.min} - ${knowledge.roomRanges.bathrooms.max} phòng
- Phổ biến: ~${knowledge.roomRanges.bathrooms.avg} phòng

🏠 LOẠI BẤT ĐỘNG SẢN:
${knowledge.propertyTypes.join(', ')}

✨ TIỆN ÍCH PHỔ BIẾN:
${knowledge.amenities.join(', ')}

🔑 TỪ KHÓA THƯỜNG GẶP TRONG MÔ TẢ:
${knowledge.descriptionKeywords.slice(0, 20).join(', ')}

📊 PHÂN BỐ MỤC ĐÍCH:
${Object.entries(knowledge.purposeDistribution).map(([k, v]) => `${k}: ${v} properties`).join(', ')}

📊 PHÂN BỐ TRẠNG THÁI:
${Object.entries(knowledge.statusDistribution).map(([k, v]) => `${k}: ${v}`).join(', ')}

${knowledge.yearBuiltRange.min ? `🏗️ NĂM XÂY DỰNG:
- Cũ nhất: ${knowledge.yearBuiltRange.min}
- Mới nhất: ${knowledge.yearBuiltRange.max}
- Trung bình: ${knowledge.yearBuiltRange.avg}
` : ''}

═══════════════════════════════════════════════════════════════
LƯU Ý QUAN TRỌNG KHI TẠO QUERY:
═══════════════════════════════════════════════════════════════

1. TÊN TÒA NHÀ/KHU ĐÔ THỊ:
   - Nếu người dùng nhắc đến tên (như "Landmark", "Vinhomes", "Masteri")
   - **PHẢI dùng $or** để tìm trong: title, description, address.fullAddress
   - Ví dụ: "landmark" -> {
       "$or": [
         {"title": {"$regex": "landmark", "$options": "i"}},
         {"description": {"$regex": "landmark", "$options": "i"}},
         {"address.fullAddress": {"$regex": "landmark", "$options": "i"}}
       ]
     }
   - LÝ DO: Tên tòa nhà thường ở trong title hoặc description, không chỉ fullAddress

2. GIÁ:
   - Dựa vào price range thực tế: ${knowledge.summary.priceRange}
   - Nếu người dùng nói "giá hợp lý", "giá trung bình" -> dùng avg price
   - "Giá cao", "luxury" -> upper range
   - "Giá rẻ", "affordable" -> lower range

3. DIỆN TÍCH:
   - Range thực tế: ${knowledge.summary.areaRange}
   - "Rộng", "lớn" -> trên average
   - "Nhỏ gọn", "compact" -> dưới average

4. TỪKHÓA MÔ TẢ:
   - Các từ khóa phổ biến: ${knowledge.descriptionKeywords.slice(0, 10).join(', ')}
   - Nếu người dùng dùng từ tương tự, hãy match với các keyword này

5. VỊ TRÍ:
   - Luôn dùng regex với $options: "i"
   - Tỉnh/thành -> address.province
   - Quận/huyện -> address.district
   - Tòa nhà/từ "gần" -> address.fullAddress

═══════════════════════════════════════════════════════════════
`
}

// Cache knowledge base (refresh every 6 hours)
let knowledgeCache = null
let lastKnowledgeUpdate = null
const KNOWLEDGE_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export const getCachedKnowledge = async () => {
  const now = Date.now()
  if (!knowledgeCache || !lastKnowledgeUpdate || (now - lastKnowledgeUpdate) > KNOWLEDGE_CACHE_TTL) {
    console.log('Refreshing property knowledge cache...')
    knowledgeCache = await getPropertyKnowledge()
    lastKnowledgeUpdate = now
  }
  return knowledgeCache
}

export const propertyKnowledgeService = {
  getPropertyKnowledge,
  formatKnowledgeForPrompt,
  getCachedKnowledge
}
