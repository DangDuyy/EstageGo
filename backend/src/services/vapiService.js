/**
 * VAPI Service
 * Handles integration with VAPI (Voice AI Platform) or custom LLM with function calling
 * Provides intelligent assistant with understanding of database and routes
 */

import fetch from 'node-fetch'
import { env } from '~/config/environment.js'
import { contextBuilderService } from './contextBuilderService.js'
import { routeKnowledgeService } from './routeKnowledgeService.js'
import propertyModel from '~/models/properties.js'
import userModel from '~/models/users.js'

/**
 * Function definitions for VAPI/LLM to call
 * These functions allow AI to interact with the system
 */
export const getFunctionDefinitions = () => {
  return [
    {
      name: 'searchProperties',
      description: 'Tìm kiếm bất động sản dựa trên các tiêu chí. Trả về danh sách properties phù hợp.',
      parameters: {
        type: 'object',
        properties: {
          province: {
            type: 'string',
            description: 'Tỉnh/Thành phố (VD: Hồ Chí Minh, Hà Nội)'
          },
          district: {
            type: 'string',
            description: 'Quận/Huyện (VD: Quận 1, Quận 2)'
          },
          type: {
            type: 'string',
            enum: ['apartment', 'house', 'condo', 'land', 'commercial', 'office', 'villa', 'townhouse', 'other'],
            description: 'Loại bất động sản'
          },
          purpose: {
            type: 'string',
            enum: ['sale', 'rent'],
            description: 'Mục đích (mua hoặc thuê)'
          },
          minPrice: {
            type: 'number',
            description: 'Giá tối thiểu (VND)'
          },
          maxPrice: {
            type: 'number',
            description: 'Giá tối đa (VND)'
          },
          minArea: {
            type: 'number',
            description: 'Diện tích tối thiểu (m²)'
          },
          maxArea: {
            type: 'number',
            description: 'Diện tích tối đa (m²)'
          },
          bedrooms: {
            type: 'number',
            description: 'Số phòng ngủ'
          },
          bathrooms: {
            type: 'number',
            description: 'Số phòng tắm'
          },
          limit: {
            type: 'number',
            description: 'Số lượng kết quả tối đa (default: 5)',
            default: 5
          }
        }
      }
    },
    {
      name: 'searchAgents',
      description: 'Tìm kiếm môi giới/agents bất động sản. Trả về danh sách agents/brokers phù hợp với tiêu chí.',
      parameters: {
        type: 'object',
        properties: {
          province: {
            type: 'string',
            description: 'Tỉnh/Thành phố mà agent hoạt động (VD: Hồ Chí Minh, Hà Nội)'
          },
          district: {
            type: 'string',
            description: 'Quận/Huyện mà agent hoạt động'
          },
          specialization: {
            type: 'string',
            description: 'Chuyên môn của agent (VD: căn hộ cao cấp, nhà phố, đất nền...)'
          },
          minExperience: {
            type: 'number',
            description: 'Số năm kinh nghiệm tối thiểu'
          },
          companyName: {
            type: 'string',
            description: 'Tên công ty môi giới'
          },
          limit: {
            type: 'number',
            description: 'Số lượng kết quả tối đa (default: 5)',
            default: 5
          }
        }
      }
    },
    {
      name: 'getPropertyDetails',
      description: 'Lấy thông tin chi tiết của một property cụ thể',
      parameters: {
        type: 'object',
        properties: {
          propertyId: {
            type: 'string',
            description: 'ID của property (MongoDB ObjectId)'
          }
        },
        required: ['propertyId']
      }
    },
    {
      name: 'getNavigationRoute',
      description: 'Tìm route/link phù hợp dựa trên yêu cầu của user về tính năng',
      parameters: {
        type: 'object',
        properties: {
          feature: {
            type: 'string',
            description: 'Tính năng user muốn dùng (VD: "tìm trên bản đồ", "xem wishlist", "đăng tin")'
          }
        },
        required: ['feature']
      }
    },
    {
      name: 'getPropertyStatistics',
      description: 'Lấy thống kê về properties (số lượng, phạm vi giá, diện tích, theo khu vực...)',
      parameters: {
        type: 'object',
        properties: {
          province: {
            type: 'string',
            description: 'Lọc theo tỉnh/thành phố (optional)'
          },
          district: {
            type: 'string',
            description: 'Lọc theo quận/huyện (optional)'
          },
          type: {
            type: 'string',
            description: 'Lọc theo loại BĐS (optional)'
          }
        }
      }
    }
  ]
}

/**
 * Execute function calls from AI
 */
export const executeFunction = async (functionName, args) => {
  try {
    switch (functionName) {
      case 'searchProperties':
        return await searchPropertiesFunction(args)
      
      case 'searchAgents':
        return await searchAgentsFunction(args)
      
      case 'getPropertyDetails':
        return await getPropertyDetailsFunction(args)
      
      case 'getNavigationRoute':
        return await getNavigationRouteFunction(args)
      
      case 'getPropertyStatistics':
        return await getPropertyStatisticsFunction(args)
      
      default:
        return { error: `Unknown function: ${functionName}` }
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error)
    return { error: error.message }
  }
}

/**
 * Function implementations
 */

// Search agents/brokers
const searchAgentsFunction = async (args) => {
  const {
    province,
    district,
    specialization,
    minExperience,
    companyName,
    limit = 5
  } = args
  
  // Build query - only active agents
  const query = { 
    role: 'agent',
    isActive: true
  }
  
  // Filter by areas served (province/district)
  if (province) {
    query.areasServed = { $regex: province, $options: 'i' }
  }
  if (district) {
    query.areasServed = { $regex: district, $options: 'i' }
  }
  
  // Filter by specialization
  if (specialization) {
    query.specializations = { $regex: specialization, $options: 'i' }
  }
  
  // Filter by experience
  if (minExperience) {
    query.experience = { $gte: minExperience }
  }
  
  // Filter by company name
  if (companyName) {
    query.companyName = { $regex: companyName, $options: 'i' }
  }
  
  // Execute query
  const agents = await userModel
    .find(query)
    .limit(Math.min(limit, 10))
    .select('userName fullName avatar phone email companyName agentTitle bio specializations areasServed experience licenseNumber website socialLinks')
    .lean()
  
  // Format results
  const results = agents.map(a => ({
    id: a._id.toString(),
    name: a.fullName || a.userName,
    userName: a.userName,
    avatar: a.avatar,
    phone: a.phone,
    email: a.email,
    company: a.companyName || 'Môi giới độc lập',
    title: a.agentTitle || 'Môi giới BĐS',
    bio: a.bio,
    specializations: a.specializations || [],
    areasServed: a.areasServed || [],
    experience: a.experience ? `${a.experience} năm` : 'Chưa cập nhật',
    licenseNumber: a.licenseNumber,
    website: a.website,
    socialLinks: a.socialLinks,
    profileUrl: `/agent/${a.userName}`
  }))
  
  return {
    success: true,
    count: results.length,
    results,
    message: results.length > 0 
      ? `Tìm thấy ${results.length} môi giới phù hợp.` 
      : 'Không tìm thấy môi giới nào phù hợp với tiêu chí.'
  }
}

// Search properties
const searchPropertiesFunction = async (args) => {
  const {
    province,
    district,
    type,
    purpose,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    bedrooms,
    bathrooms,
    limit = 5
  } = args
  
  // Build query
  const query = { status: 'active', visibility: 'public' }
  
  if (province) query['address.province'] = { $regex: province, $options: 'i' }
  if (district) query['address.district'] = { $regex: district, $options: 'i' }
  if (type) query.type = type
  if (purpose) query.purpose = purpose
  
  if (minPrice || maxPrice) {
    query['price.value'] = {}
    if (minPrice) query['price.value'].$gte = minPrice
    if (maxPrice) query['price.value'].$lte = maxPrice
  }
  
  if (minArea || maxArea) {
    query.area = {}
    if (minArea) query.area.$gte = minArea
    if (maxArea) query.area.$lte = maxArea
  }
  
  if (bedrooms) query['rooms.bedrooms'] = bedrooms
  if (bathrooms) query['rooms.bathrooms'] = bathrooms
  
  // Execute query
  const properties = await propertyModel
    .find(query)
    .limit(Math.min(limit, 10))
    .select('title slug type purpose price area rooms address.province address.district address.fullAddress media')
    .lean()
  
  // Format results
  const results = properties.map(p => ({
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    type: p.type,
    purpose: p.purpose,
    price: `${p.price.value.toLocaleString()} ${p.price.currency}`,
    area: `${p.area} m²`,
    bedrooms: p.rooms?.bedrooms || 0,
    bathrooms: p.rooms?.bathrooms || 0,
    location: `${p.address.district}, ${p.address.province}`,
    fullAddress: p.address.fullAddress,
    image: p.media?.[0]?.url || null,
    detailUrl: `/property/${p.slug}`
  }))
  
  return {
    success: true,
    count: results.length,
    results,
    message: results.length > 0 
      ? `Tìm thấy ${results.length} properties phù hợp.` 
      : 'Không tìm thấy property nào phù hợp với tiêu chí.'
  }
}

// Get property details
const getPropertyDetailsFunction = async (args) => {
  const { propertyId } = args
  
  const property = await propertyModel
    .findById(propertyId)
    .populate('owner', 'userName fullName avatar phone email')
    .lean()
  
  if (!property) {
    return { success: false, error: 'Property not found' }
  }
  
  return {
    success: true,
    property: {
      id: property._id.toString(),
      title: property.title,
      description: property.description,
      slug: property.slug,
      type: property.type,
      purpose: property.purpose,
      price: {
        value: property.price.value,
        formatted: `${property.price.value.toLocaleString()} ${property.price.currency}`,
        period: property.price.period
      },
      area: property.area,
      rooms: property.rooms,
      amenities: property.amenities,
      address: property.address,
      yearBuilt: property.yearBuilt,
      images: property.media?.filter(m => m.type === 'image').map(m => m.url) || [],
      owner: property.owner ? {
        name: property.owner.fullName || property.owner.userName,
        phone: property.owner.phone,
        avatar: property.owner.avatar
      } : null,
      detailUrl: `/property/${property.slug}`
    }
  }
}

// Get navigation route
const getNavigationRouteFunction = async (args) => {
  const { feature } = args
  
  const routeInfo = routeKnowledgeService.findRouteByIntent(feature)
  
  if (routeInfo) {
    // Get detailed info about this route
    const knowledge = routeKnowledgeService.getRouteKnowledge()
    let routeDetails = null
    
    // Search for route details in knowledge base
    for (const category of Object.values(knowledge)) {
      if (category.routes) {
        for (const route of category.routes) {
          if (route.frontend?.route === routeInfo.route) {
            routeDetails = route
            break
          }
        }
      } else if (Array.isArray(category)) {
        for (const route of category) {
          if (route.route === routeInfo.route) {
            routeDetails = route
            break
          }
        }
      }
      if (routeDetails) break
    }
    
    return {
      success: true,
      route: routeInfo.route,
      keyword: routeInfo.keyword,
      details: routeDetails ? {
        name: routeDetails.name,
        description: routeDetails.description,
        requiresAuth: routeDetails.requiresAuth,
        requiredRole: routeDetails.requiredRole
      } : null
    }
  }
  
  return {
    success: false,
    message: 'Không tìm thấy route phù hợp. Vui lòng mô tả rõ hơn tính năng bạn cần.'
  }
}

// Get property statistics
const getPropertyStatisticsFunction = async (args) => {
  const { province, district, type } = args
  
  const query = { status: 'active', visibility: 'public' }
  if (province) query['address.province'] = { $regex: province, $options: 'i' }
  if (district) query['address.district'] = { $regex: district, $options: 'i' }
  if (type) query.type = type
  
  const [stats, typeDistribution] = await Promise.all([
    // Overall statistics
    propertyModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          minPrice: { $min: '$price.value' },
          maxPrice: { $max: '$price.value' },
          avgPrice: { $avg: '$price.value' },
          minArea: { $min: '$area' },
          maxArea: { $max: '$area' },
          avgArea: { $avg: '$area' }
        }
      }
    ]),
    
    // Type distribution
    propertyModel.aggregate([
      { $match: query },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ])
  
  const statsData = stats[0] || {}
  
  return {
    success: true,
    statistics: {
      total: statsData.count || 0,
      price: {
        min: statsData.minPrice || 0,
        max: statsData.maxPrice || 0,
        avg: Math.round(statsData.avgPrice || 0),
        formatted: {
          min: `${(statsData.minPrice || 0).toLocaleString()} VND`,
          max: `${(statsData.maxPrice || 0).toLocaleString()} VND`,
          avg: `${Math.round(statsData.avgPrice || 0).toLocaleString()} VND`
        }
      },
      area: {
        min: statsData.minArea || 0,
        max: statsData.maxArea || 0,
        avg: Math.round(statsData.avgArea || 0),
        formatted: {
          min: `${statsData.minArea || 0} m²`,
          max: `${statsData.maxArea || 0} m²`,
          avg: `${Math.round(statsData.avgArea || 0)} m²`
        }
      },
      typeDistribution: typeDistribution.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {}),
      filters: {
        province: province || 'All',
        district: district || 'All',
        type: type || 'All'
      }
    }
  }
}

/**
 * Chat with AI using Ollama (or any LLM) with context
 */
export const chatWithAI = async (userMessage, options = {}) => {
  const {
    messages = [],
    userProfile = null,
    includeContext = true
  } = options
  
  try {
    // Build context
    let systemPrompt = ''
    if (includeContext) {
      const context = await contextBuilderService.buildCompleteContext({
        userQuery: userMessage,
        messages,
        userProfile,
        includeDatabase: true,
        includeRoutes: true,
        includeExamples: true
      })
      systemPrompt = context.fullContext
    }
    
    // Call Ollama (or your LLM)
    const response = await fetch(`${env.OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: userMessage,
        system: systemPrompt,
        stream: false,
        keep_alive: '10m',
        options: { 
          num_predict: -1,
          temperature: 0.7
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }
    
    const data = await response.json()
    let aiResponse = data.response || ''
    
    // Clean response
    if (aiResponse.startsWith('"') && aiResponse.endsWith('"')) {
      aiResponse = aiResponse.slice(1, -1)
    }
    
    return {
      success: true,
      response: aiResponse.trim(),
      model: env.OLLAMA_MODEL
    }
    
  } catch (error) {
    console.error('Error in chatWithAI:', error)
    return {
      success: false,
      error: error.message,
      response: 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
    }
  }
}

/**
 * Enhanced chat with function calling support
 * This analyzes if user query needs function execution
 */
export const chatWithFunctionCalling = async (userMessage, options = {}) => {
  const { messages = [], userProfile = null } = options
  
  // Analyze if we need to call functions FIRST (before AI response)
  const query = userMessage.toLowerCase()
  const functionCalls = []
  
  // Detect agent/broker search intent
  if (/môi giới|agent|broker|cò nhà|sales|tư vấn viên/i.test(query)) {
    const agentParams = {}
    
    // Extract location for agents
    if (/quận 1|quan 1/i.test(query)) agentParams.district = 'Quận 1'
    if (/quận 2|quan 2/i.test(query)) agentParams.district = 'Quận 2'
    if (/hồ chí minh|hcm|sài gòn|saigon/i.test(query)) agentParams.province = 'Hồ Chí Minh'
    if (/hà nội|ha noi|hanoi/i.test(query)) agentParams.province = 'Hà Nội'
    
    // Extract specialization
    if (/căn hộ|can ho|apartment/i.test(query)) agentParams.specialization = 'căn hộ'
    if (/nhà phố|nha pho/i.test(query)) agentParams.specialization = 'nhà phố'
    if (/villa/i.test(query)) agentParams.specialization = 'villa'
    if (/đất nền|dat nen/i.test(query)) agentParams.specialization = 'đất nền'
    
    functionCalls.push({
      function: 'searchAgents',
      args: agentParams
    })
  }
  // Detect property search intent
  else if (/tìm|tìm kiếm|search|có|cần|cho tôi/i.test(query) && !/môi giới|agent|broker/i.test(query)) {
    // Extract search parameters from query (simplified)
    const searchParams = {}
    
    // Extract location
    if (/quận 1|quan 1/i.test(query)) searchParams.district = 'Quận 1'
    if (/quận 2|quan 2/i.test(query)) searchParams.district = 'Quận 2'
    if (/hồ chí minh|hcm|sài gòn|saigon/i.test(query)) searchParams.province = 'Hồ Chí Minh'
    if (/hà nội|ha noi|hanoi/i.test(query)) searchParams.province = 'Hà Nội'
    
    // Extract type
    if (/căn hộ|can ho|apartment/i.test(query)) searchParams.type = 'apartment'
    if (/nhà phố|nha pho|house/i.test(query)) searchParams.type = 'house'
    if (/villa/i.test(query)) searchParams.type = 'villa'
    
    // Extract purpose
    if (/thuê|thue|rent/i.test(query)) searchParams.purpose = 'rent'
    if (/mua|bán|ban|sale/i.test(query)) searchParams.purpose = 'sale'
    
    // Extract numbers (price, area, rooms)
    const numbers = query.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      // Simple heuristic: if number > 1000000, it's price; if < 10, it's rooms; else area
      for (const num of numbers) {
        const n = parseInt(num)
        if (n > 1000000) searchParams.maxPrice = n * 1000000 // tỷ
        else if (n < 10 && /phòng|phong|bedroom/i.test(query)) searchParams.bedrooms = n
        else if (n > 10 && n < 1000) searchParams.minArea = n // m²
      }
    }
    
    if (Object.keys(searchParams).length > 0) {
      functionCalls.push({
        function: 'searchProperties',
        args: searchParams
      })
    }
  }
  
  // Detect navigation intent
  if (/route|trang|page|link|vào đâu|làm sao|ở đâu/i.test(query)) {
    functionCalls.push({
      function: 'getNavigationRoute',
      args: { feature: query }
    })
  }
  
  // Detect statistics intent
  if (/thống kê|statistics|số lượng|bao nhiêu property|có bao nhiêu/i.test(query)) {
    functionCalls.push({
      function: 'getPropertyStatistics',
      args: {}
    })
  }
  
  // Execute function calls FIRST
  const functionResults = []
  for (const call of functionCalls) {
    console.log(`[VAPI Service] Executing function: ${call.function}`, call.args)
    const result = await executeFunction(call.function, call.args)
    console.log(`[VAPI Service] Function result:`, result)
    functionResults.push({
      function: call.function,
      result
    })
  }
  
  // If we have function results, format response directly from data (NO AI generation)
  if (functionResults.length > 0) {
    console.log('[VAPI Service] Formatting response directly from function results (no AI)')
    
    let directResponse = ''
    
    for (const fr of functionResults) {
      const { function: funcName, result } = fr
      
      if (result.success === false) {
        directResponse += `⚠️ Xin lỗi, tôi gặp lỗi khi tìm kiếm: ${result.error || result.message}\n\n`
        continue
      }
      
      // Format based on function type - DIRECT FORMATTING, NO AI
      if (funcName === 'searchAgents') {
        if (result.count === 0) {
          directResponse += `🔍 Không tìm thấy môi giới nào phù hợp với tiêu chí trong database.\n\nBạn có thể thử:\n- Tìm với khu vực khác\n- Hoặc xem tất cả môi giới tại /agents`
        } else {
          directResponse += `👔 Tìm thấy ${result.count} môi giới trong database:\n\n`
          
          result.results.forEach((agent, idx) => {
            directResponse += `**${idx + 1}. ${agent.name}**`
            if (agent.userName) directResponse += ` (@${agent.userName})`
            directResponse += `\n`
            directResponse += `🏢 Công ty: ${agent.company}\n`
            if (agent.phone) directResponse += `📞 Phone: ${agent.phone}\n`
            if (agent.email) directResponse += `📧 Email: ${agent.email}\n`
            if (agent.specializations && agent.specializations.length > 0) {
              directResponse += `🎯 Chuyên môn: ${agent.specializations.join(', ')}\n`
            }
            if (agent.areasServed && agent.areasServed.length > 0) {
              directResponse += `📍 Khu vực: ${agent.areasServed.join(', ')}\n`
            }
            directResponse += `⏳ Kinh nghiệm: ${agent.experience}\n`
            directResponse += `🔗 Profile: ${agent.profileUrl}\n\n`
          })
          
          directResponse += `Bạn có thể xem profile chi tiết hoặc liên hệ trực tiếp!`
        }
      } else if (funcName === 'searchProperties') {
        if (result.count === 0) {
          directResponse += `🏠 Không tìm thấy properties nào phù hợp với tiêu chí.\n\n`
        } else {
          directResponse += `🏠 Tìm thấy ${result.count} properties:\n\n`
          
          result.results.forEach((prop, idx) => {
            directResponse += `**${idx + 1}. ${prop.title}**\n`
            directResponse += `💰 Giá: ${prop.price}\n`
            directResponse += `📐 Diện tích: ${prop.area}\n`
            directResponse += `📍 Vị trí: ${prop.location}\n`
            directResponse += `🔗 Xem chi tiết: ${prop.detailUrl}\n\n`
          })
        }
      } else if (funcName === 'getPropertyStatistics') {
        const stats = result.statistics
        directResponse += `📊 Thống kê bất động sản:\n\n`
        directResponse += `📈 Tổng số: ${stats.total} properties\n`
        directResponse += `💰 Giá: ${stats.price.formatted.min} - ${stats.price.formatted.max}\n`
        directResponse += `📐 Diện tích: ${stats.area.formatted.min} - ${stats.area.formatted.max}\n\n`
      } else if (funcName === 'getNavigationRoute') {
        if (result.success && result.route) {
          directResponse += `🎯 Bạn có thể vào: **${result.route}**\n\n`
          if (result.details) {
            directResponse += `${result.details.description}\n`
          }
        } else {
          directResponse += `❓ ${result.message || 'Không tìm thấy route phù hợp'}\n\n`
        }
      }
    }
    
    return {
      success: true,
      response: directResponse.trim(),
      functionCalls: functionResults,
      model: 'direct-formatting'
    }
  }
  
  // No function calls, use AI for general questions only
  const aiResult = await chatWithAI(userMessage, { 
    messages, 
    userProfile, 
    includeContext: true 
  })
  
  if (!aiResult.success) {
    return aiResult
  }
  
  return {
    success: true,
    response: aiResult.response,
    functionCalls: functionResults,
    model: aiResult.model
  }
}

export const vapiService = {
  getFunctionDefinitions,
  executeFunction,
  chatWithAI,
  chatWithFunctionCalling
}
