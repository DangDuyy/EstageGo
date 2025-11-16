import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "~/config/environment"
import fetch from "node-fetch"

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

const analyzeImageWithGemini = async (imageUrl) => {
  try {
    console.log('[ImageTagging] Fetching image from URL:', imageUrl)
    
    // Download image from URL
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    
    console.log('[ImageTagging] Image downloaded, size:', arrayBuffer.byteLength, 'bytes')
    
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const prompt = `Analyze this property/real estate image and provide:
1. Room type or space (e.g., bedroom, kitchen, living room, bathroom, exterior, balcony, etc.)
2. Key features and objects visible (e.g., furniture, appliances, fixtures)
3. Condition and style descriptors (e.g., modern, spacious, bright, renovated)

Return response in JSON format:
{
  "roomType": "string",
  "tags": ["tag1", "tag2", "tag3"],
  "objects": [{"name": "object name", "confidence": 0.95}],
  "description": "brief description"
}

Be specific and relevant to real estate. Focus on features that matter to property buyers/renters.`

    console.log('[ImageTagging] Sending request to Gemini API...')
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: response.headers.get('content-type') || 'image/jpeg',
          data: base64Image
        }
      }
    ])
    
    const text = result.response.text()
    console.log('[ImageTagging] Gemini response:', text.substring(0, 200) + '...')
    
    // Parse JSON from response (remove markdown code blocks if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ImageTagging] Failed to parse JSON from response:', text)
      throw new Error('Failed to parse JSON response from Gemini')
    }
    
    const analysis = JSON.parse(jsonMatch[0])
    console.log('[ImageTagging] Parsed analysis:', analysis)
    
    // Format response to match our schema
    const tags = []
    
    // Add room type as primary tag
    if (analysis.roomType) {
      tags.push({
        label: analysis.roomType.toLowerCase(),
        confidence: 0.95,
        source: 'ai'
      })
    }
    
    // Add other tags
    if (analysis.tags && Array.isArray(analysis.tags)) {
      analysis.tags.forEach(tag => {
        tags.push({
          label: String(tag).toLowerCase(),
          confidence: 0.85,
          source: 'ai'
        })
      })
    }
    
    // Format detected objects
    const detectedObjects = []
    if (analysis.objects && Array.isArray(analysis.objects)) {
      analysis.objects.forEach(obj => {
        detectedObjects.push({
          name: obj.name,
          confidence: obj.confidence || 0.8
        })
      })
    }
    
    return {
      tags,
      detectedObjects,
      description: analysis.description || '',
      roomType: analysis.roomType || 'unknown',
      analyzed: true,
      analyzedAt: new Date()
    }
    
  } catch (error) {
    console.error('[ImageTagging] Error analyzing image:', error)
    throw new Error(`Failed to analyze image: ${error.message}`)
  }
}

const analyzeMultipleImages = async (imageUrls) => {
  const results = []
  
  for (const url of imageUrls) {
    try {
      const analysis = await analyzeImageWithGemini(url)
      results.push({
        url,
        success: true,
        ...analysis
      })
    } catch (error) {
      results.push({
        url,
        success: false,
        error: error.message
      })
    }
  }
  
  return results
}

const extractCommonTags = (allTags) => {
  const tagCounts = {}
  
  allTags.forEach(tag => {
    const label = tag.label.toLowerCase()
    if (!tagCounts[label]) {
      tagCounts[label] = { count: 0, totalConfidence: 0 }
    }
    tagCounts[label].count++
    tagCounts[label].totalConfidence += tag.confidence
  })
  
  // Sort by count and return top tags
  return Object.entries(tagCounts)
    .map(([label, data]) => ({
      label,
      count: data.count,
      avgConfidence: data.totalConfidence / data.count
    }))
    .sort((a, b) => b.count - a.count)
}

export const imageTaggingService = {
  analyzeImageWithGemini,
  analyzeMultipleImages,
  extractCommonTags
}
