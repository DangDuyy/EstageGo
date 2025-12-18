import { date } from "joi"
import { mediaService } from "~/services/mediaService"
import { toArr, toNum, toStr } from "~/utils/formatter"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchSuggestionService } from "~/services/searchSuggestionService"
import { propertyKnowledgeService } from "~/services/propertyKnowledgeService"
import { imageTaggingService } from "~/services/imageTaggingService"
import { documentVerificationService } from "~/services/documentVerificationService"
import { env } from "~/config/environment"
import { StatusCodes } from "http-status-codes"
import { propertyService } from "~/services/propertyService"
import paymentService from "~/services/paymentService"

const safeParse = (v) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return v }
  }
  return v
}

const computeSaleBase = (v) => {
  if (v < 500_000_000) return 300_000
  if (v <= 2_000_000_000) return 600_000
  return 1_000_000
}
const computeRentBase = (v) => {
  if (v < 10_000_000) return 150_000
  if (v <= 30_000_000) return 300_000
  return 600_000
}

const createProperty = async (req, res, next) => {
  try {
    // Normalize complex fields from multipart
    const body = { ...req.body }
    body.price = safeParse(body.price)
    body.address = safeParse(body.address)
    body.rooms = safeParse(body.rooms)

    res.status(StatusCodes.OK).json(body)
    return

    const owner = req.jwtDecoded?._id
    if (!owner) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })

    const user = await propertyService.getUserById(owner)
    if (!user) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "User not found" })

    const membership = user.membershipLevel || 'basic'
    const purpose = body.purpose === 'rent' ? 'rent' : 'sale'
    const propertyPriceValue = Number(body?.price?.value || 0)

    const baseFee = purpose === 'rent' ? computeRentBase(propertyPriceValue) : computeSaleBase(propertyPriceValue)
    const discountPercent = membership === 'premium' ? 30 : membership === 'standard' ? 10 : 0
    const feeAfterDiscount = Math.round(baseFee * (1 - discountPercent / 100))

    let postType = 'normal'
    let expireDays
    if (membership === 'premium') { postType = 'vip'; expireDays = 15 }
    else if (membership === 'standard') { expireDays = purpose === 'rent' ? 14 : 7 }
    else { expireDays = purpose === 'rent' ? 7 : 3 }
    const expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000)

    if (user.balance < feeAfterDiscount) {
      return res.status(StatusCodes.PAYMENT_REQUIRED).json({
        success: false,
        message: "Insufficient balance to pay listing fee",
        required: feeAfterDiscount,
        currentBalance: user.balance
      })
    }

    const propertyData = {
      ...body,
      owner,
      postType,
      listingFee: feeAfterDiscount,
      expireAt,
      visibility: 'public'
    }

    const newProperty = await propertyService.createProperty(propertyData)

    await paymentService.deductBalance({
      userId: owner,
      amount: feeAfterDiscount,
      description: `Listing fee (${purpose}) - ${newProperty.title}`,
      referenceId: newProperty._id.toString()
    })

    const files = req.files || []
    let updateProperty = newProperty
    if (files.length && mediaService?.uploadPropertyImage) {
      const uploadResult = await mediaService.uploadPropertyImage(files, newProperty._id)
      updateProperty = await propertyService.addMediaToProperty(newProperty._id, uploadResult.flat())
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Property created successfully",
      data: updateProperty,
      feeCharged: feeAfterDiscount,
      discountPercent,
      postType,
      expireAt
    })
  } catch (error) {
    console.error("Error createProperty:", error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Internal Server Error"
    })
  }
}

const verifyPropertyDocuments = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const rawPropertyData = req.body?.propertyData
    const idDocs = req.files?.idDocs || []
    const houseDocs = req.files?.houseDocs || []

    if (!rawPropertyData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Property data is required for verification"
      })
    }

    if (!idDocs.length || !houseDocs.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Both ID documents and house documents are required"
      })
    }

    let propertyData
    try {
      propertyData = typeof rawPropertyData === "string"
        ? JSON.parse(rawPropertyData)
        : rawPropertyData
    } catch (parseError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Property data payload is invalid JSON"
      })
    }

    const normalizedPropertyData = {
      ...propertyData,
      address: propertyData?.address || {}
    }

    const user = await propertyService.getUserById(userId)

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found"
      })
    }

    const userInfo = {
      fullName: user.fullName || user.userName,
      dob: user.dob
    }

    const cccdAnalysis = await documentVerificationService.verifyCCCD({
      file: idDocs[0],
      userInfo
    })

    if (!cccdAnalysis?.verificationResult?.isUserMatch || !cccdAnalysis?.verificationResult?.isFormatValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: cccdAnalysis?.verificationResult?.mismatchDetails || "CCCD verification failed",
        data: {
          cccd: cccdAnalysis
        }
      })
    }

    const houseDocAnalysis = await documentVerificationService.verifyHouseDocument({
      file: houseDocs[0],
      propertyData: normalizedPropertyData
    })

    const verification = houseDocAnalysis?.verificationResult || {}
    if (!verification.isFormatValid || !verification.isAddressMatch || !verification.isAreaMatch) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: verification.mismatchDetails || "House document does not match listing details",
        data: {
          cccd: cccdAnalysis,
          houseDoc: houseDocAnalysis
        }
      })
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Documents verified successfully",
      data: {
        cccd: cccdAnalysis,
        houseDoc: houseDocAnalysis
      }
    })
  } catch (error) {
    console.error("Error verifying property documents:", error)
    next(error)
  }
}

const uploadPropertyMedia = async (req, res, next) => {
    const { _id } = req.params
    const userId = req.jwtDecoded._id
    const files = req.files || []

    const property = await propertyService.getPropertyById(_id)
    if (property.owner.toString() !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: "You can only upload media to your owner properties"
        })
    }

    const uploadResult = await mediaService.uploadPropertyImage(files, property._id)
    const mediaItems = uploadResult.flat()

    const updateProperty = await propertyService.addMediaToProperty(property._id, mediaItems)

    res.status(StatusCodes.OK).json({
        success: true,
        message: "Media uploaded successfully",
        data: updateProperty
    })
}

const getProperties = async (req, res, next) => {
    try {
        const { page, itemsPerPage, ...raw } = req.query

        const queryFilter = {
            // search
            q: toStr(raw.q),

            // type / types
            types: toArr(raw.types).map(s => String(s).trim().toLowerCase()),
            type: raw.type ? String(raw.type).trim().toLowerCase() : undefined,

            // location
            province: toStr(raw.province),
            provinces: toArr(raw.provinces).map(toStr).filter(Boolean),
            district: toStr(raw.district),
            ward: toStr(raw.ward),

            // purpose / status
            purpose: raw.purpose ? String(raw.purpose).trim().toLowerCase() : undefined,
            status: raw.status ? String(raw.status).trim().toLowerCase() : undefined,

            // rooms
            bedrooms: raw.bedrooms !== undefined ? Number(raw.bedrooms) : undefined,
            bedroomsMin: toNum(raw.bedroomsMin),
            bedroomsMax: toNum(raw.bedroomsMax),
            bathrooms: raw.bathrooms !== undefined ? Number(raw.bathrooms) : undefined,
            bathroomsMin: toNum(raw.bathroomsMin),
            bathroomsMax: toNum(raw.bathroomsMax),

            // area & price
            area: raw.area !== undefined ? Number(raw.area) : undefined,
            areaMin: toNum(raw.areaMin),
            areaMax: toNum(raw.areaMax),
            price: raw.price !== undefined ? Number(raw.price) : undefined,
            priceMin: toNum(raw.priceMin),
            priceMax: toNum(raw.priceMax),

            // amenities
            amenitiesAll: toArr(raw.amenitiesAll).map(toStr).filter(Boolean),
            amenitiesAny: toArr(raw.amenitiesAny).map(toStr).filter(Boolean),

            // owner
            owner: toStr(raw.owner),

            // sort
            sortBy: toStr(raw.sortBy),
            sortDir: toStr(raw.sortDir)
        }

        // gộp type đơn lẻ vào types (nếu cả hai cùng có)
        if (queryFilter.type) {
            queryFilter.types = Array.from(new Set([...(queryFilter.types || []), queryFilter.type]))
            delete queryFilter.type
        }

        const result = await propertyService.getProperties(page, itemsPerPage, queryFilter)
        
        // Nếu không có kết quả và có search query, tìm suggestions
        let searchSuggestions = null
        if (result.totalProperties === 0 && queryFilter.q) {
            searchSuggestions = await searchSuggestionService.findSearchSuggestions(queryFilter.q)
        }
        
        return res.status(StatusCodes.OK).json({
            ...result,
            ...(searchSuggestions && { searchSuggestions })
        })
    } catch (error) {
        next(error)
    }
}

const getPropertyDetails = async (req, res, next) => {
    try {
        const propertyId = req.params.id
        const result = await propertyService.getPropertyDetails(propertyId)
        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const getPropertiesWithMap = async (req, res, next) => {
    try{
        const query = req.query

        const result = await propertyService.getPropertiesWithMap(query)

        return res.status(StatusCodes.OK).json(result)
    }
    catch(error){
        next(error)
    }
}

const getPropertiesWithinPolygon = async (req, res, next) => {
    try {
        const { polygon } = req.body;
        console.log(polygon)

        // Tạo GeoJSON polygon
        const polygonGeoJSON = {
            type: "Polygon",
            coordinates: [polygon], // Mảng 2D: [[lng, lat], ...]
        };

        const result = await propertyService.getPropertiesWithinPolygon(polygon)

        return res.status(StatusCodes.OK).json(result)
    } catch (error) {
        next(error)
    }
}

const naturalLanguageSearch = async (req, res, next) => {
    try {
        const { naturalLanguageQuery } = req.body;

        if (!naturalLanguageQuery || typeof naturalLanguageQuery !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Vui lòng nhập câu tìm kiếm."
            });
        }

        // Kiểm tra GEMINI_API_KEY
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY không được cấu hình trong .env");
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "AI service chưa được cấu hình."
            });
        }

        // Khởi tạo Gemini client với model ổn định
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash"
        });

        // Lấy knowledge base từ database để AI hiểu data thực tế
        const knowledge = await propertyKnowledgeService.getCachedKnowledge();
        const knowledgeContext = knowledge ? propertyKnowledgeService.formatKnowledgeForPrompt(knowledge) : '';

        // Xây dựng prompt với context từ database
        const prompt = `
Bạn là công cụ chuyển đổi ngôn ngữ tìm kiếm bất động sản từ tiếng Việt/tiếng Anh sang bộ lọc truy vấn MongoDB (Mongoose).

${knowledgeContext}

Yêu cầu người dùng: "${naturalLanguageQuery}"

QUAN TRỌNG: Trả về kết quả dưới dạng JSON object hợp lệ. Không thêm bất kỳ văn bản giải thích nào, chỉ trả về JSON thuần túy.

Quy tắc chuyển đổi:
1. Chuyển đổi tiền tệ:
   - "tỷ", "billion", "B" -> nhân với 1000000000
   - "triệu", "million", "M" -> nhân với 1000000
   - Ví dụ: "3 tỷ" -> 3000000000, "500 triệu" -> 500000000

2. So sánh:
   - "dưới", "under", "max", "tối đa", "không quá" -> $lte
   - "trên", "over", "min", "tối thiểu", "từ", "ít nhất" -> $gte
   - "chính xác", "exactly" -> $eq
   - "từ X đến Y" -> { $gte: X, $lte: Y }

3. Loại bất động sản (type):
   - "căn hộ", "chung cư", "apartment" -> "apartment"
   - "nhà phố", "nhà riêng", "house" -> "house"
   - "biệt thự", "villa" -> "villa"
   - "đất", "mảnh đất", "land" -> "land"
   - "văn phòng", "office" -> "office"
   - "condotel", "condo" -> "condo"
   - "thương mại", "commercial" -> "commercial"
   - "nhà liền kề", "townhouse" -> "townhouse"

4. Mục đích (purpose):
   - "bán", "mua", "sale", "buy", "for sale" -> "sale"
   - "thuê", "cho thuê", "rent", "for rent" -> "rent"

5. Vị trí và Tên Tòa Nhà:
   - **QUAN TRỌNG**: Nếu người dùng nhắc đến TÊN TÒA NHÀ/KHU ĐÔ THỊ (như Landmark, Vinhomes, Masteri, The Manor, etc.),
     PHẢI TẠO QUERY $or TÌM TRONG NHIỀU TRƯỜNG: title, description, address.fullAddress
   
   - Ví dụ TÊN TÒA NHÀ:
     "landmark" -> {
       "$or": [
         {"title": {"$regex": "landmark", "$options": "i"}},
         {"description": {"$regex": "landmark", "$options": "i"}},
         {"address.fullAddress": {"$regex": "landmark", "$options": "i"}}
       ]
     }
   
   - Ví dụ TÊN + LOẠI:
     "căn hộ landmark" -> {
       "type": "apartment",
       "$or": [
         {"title": {"$regex": "landmark", "$options": "i"}},
         {"description": {"$regex": "landmark", "$options": "i"}},
         {"address.fullAddress": {"$regex": "landmark", "$options": "i"}}
       ]
     }
   
   - VỊ TRÍ HÀNH CHÍNH (không phải tên tòa nhà):
     - Tỉnh/thành -> address.province (regex)
     - Quận/huyện -> address.district (regex)
     - Từ "gần" + địa điểm -> address.fullAddress (regex)

6. Phòng:
   - "3BR", "3 bedrooms", "3 phòng ngủ" -> rooms.bedrooms
   - "2 phòng tắm", "2 bathrooms" -> rooms.bathrooms

7. Tiện ích (amenities):
   - "bể bơi", "swimming pool" -> amenities: { $in: ["swimming pool"] }
   - "gym", "phòng gym" -> amenities: { $in: ["gym"] }
   - Danh sách: "pool, gym, parking" -> amenities: { $in: ["swimming pool", "gym", "parking"] }

8. Status:
   - Mặc định không cần truyền (backend sẽ lấy active)
   - Nếu có từ "đã bán", "sold" -> status: "sold"
   - Nếu có từ "đã cho thuê", "rented" -> status: "rented"

**CHỈ** trả về JSON object tuân thủ schema. Không giải thích, không thêm văn bản.
Nếu không có thông tin về một trường nào đó, bỏ qua trường đó (nullable).

Ví dụ output hợp lệ:

Ví dụ 1 - Tìm theo TÊN TÒA NHÀ (search trong title, description, fullAddress):
{
  "type": "apartment",
  "purpose": "sale",
  "$or": [
    {"title": {"$regex": "landmark", "$options": "i"}},
    {"description": {"$regex": "landmark", "$options": "i"}},
    {"address.fullAddress": {"$regex": "landmark", "$options": "i"}}
  ]
}

Ví dụ 2 - Tên tòa nhà + Nhiều tiêu chí:
{
  "type": "apartment",
  "purpose": "sale",
  "rooms.bedrooms": { "$gte": 2 },
  "price.value": { "$lte": 5000000000 },
  "$or": [
    {"title": {"$regex": "vinhomes", "$options": "i"}},
    {"description": {"$regex": "vinhomes", "$options": "i"}},
    {"address.fullAddress": {"$regex": "vinhomes", "$options": "i"}}
  ]
}

Ví dụ 3 - Tìm theo quận (VỊ TRÍ HÀNH CHÍNH, không dùng $or):
{
  "type": "apartment",
  "address.district": { "$regex": "quận 1", "$options": "i" }
}

Ví dụ 4 - Tìm theo địa điểm gần (dùng fullAddress):
{
  "address.fullAddress": { "$regex": "gần trường", "$options": "i" }
}
`;

        // Gọi Gemini API với error handling và timeout
        let result;
        try {
            // Set timeout cho API call (10 giây)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI request timeout')), 10000)
            );
            
            result = await Promise.race([
                model.generateContent(prompt),
                timeoutPromise
            ]);
        } catch (aiError) {
            console.error("Google AI API Error:", aiError);
            console.error("Error details:", {
                name: aiError.name,
                message: aiError.message,
                cause: aiError.cause
            });
            
            // Kiểm tra timeout
            if (aiError.message && aiError.message.includes('timeout')) {
                return res.status(StatusCodes.REQUEST_TIMEOUT).json({
                    success: false,
                    message: "AI service không phản hồi. Vui lòng thử lại."
                });
            }
            
            // Kiểm tra rate limit error
            if (aiError.message && (aiError.message.includes('quota') || aiError.message.includes('429'))) {
                return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                    success: false,
                    message: "AI service đang bận. Vui lòng thử lại sau ít phút."
                });
            }
            
            // Kiểm tra retry delay
            if (aiError.message && aiError.message.includes('retryDelay')) {
                return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                    success: false,
                    message: "AI service tạm thời quá tải. Vui lòng thử lại sau 1 phút."
                });
            }
            
            // Kiểm tra API key invalid
            if (aiError.message && (aiError.message.includes('API key') || aiError.message.includes('401') || aiError.message.includes('403'))) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Lỗi cấu hình AI service. Vui lòng liên hệ quản trị viên."
                });
            }
            
            // Kiểm tra network error
            if (aiError.name === 'GoogleGenerativeAIFetchError' || aiError.message.includes('fetch')) {
                return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                    success: false,
                    message: "Không thể kết nối tới AI service. Vui lòng kiểm tra kết nối mạng và thử lại."
                });
            }
            
            // Lỗi khác
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Không thể kết nối tới AI service. Vui lòng thử lại.",
                error: process.env.NODE_ENV === 'development' ? aiError.message : undefined
            });
        }
        
        let responseText = result.response.text();
        console.log("AI Response (raw):", responseText);

        // Parse JSON - xử lý markdown code blocks nếu có
        let filters;
        try {
            // Loại bỏ markdown code blocks nếu có (```json ... ``` hoặc ``` ... ```)
            responseText = responseText.trim();
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }
            
            filters = JSON.parse(responseText);
            console.log("AI Parsed Filters:", filters);
        } catch (parseError) {
            console.error("Lỗi parse JSON từ Gemini:", parseError);
            console.error("Response text:", responseText);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "AI không thể tạo ra truy vấn hợp lệ.",
                debug: process.env.NODE_ENV === 'development' ? responseText : undefined
            });
        }

        // Loại bỏ các trường null/undefined/empty
        const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && 
                !(typeof value === 'object' && Object.keys(value).length === 0)) {
                acc[key] = value;
            }
            return acc;
        }, {});

        console.log("AI Generated Filters:", cleanFilters);
        console.log("Natural Language Query:", naturalLanguageQuery);

        // Thực thi truy vấn MongoDB
        const properties = await propertyService.getPropertiesByFilters(cleanFilters);
        console.log(`Found ${properties.length} properties`);

        // Nếu không có kết quả, tìm suggestions (không block main flow)
        let searchSuggestions = null
        if (properties.length === 0) {
            try {
                // Extract keywords từ query
                const locationKeywords = searchSuggestionService.extractLocationKeywords(naturalLanguageQuery)
                
                // Tìm suggestions cho toàn bộ query hoặc từng keyword
                const querySuggestions = await searchSuggestionService.findSearchSuggestions(naturalLanguageQuery)
                
                // Nếu có location keywords, tìm suggestions cho chúng
                const keywordSuggestions = []
                for (const keyword of locationKeywords.slice(0, 3)) { // Limit to 3 keywords
                    const kws = await searchSuggestionService.findSearchSuggestions(keyword, 3)
                    if (kws.didYouMean) {
                        keywordSuggestions.push({
                            original: keyword,
                            suggestion: kws.didYouMean
                        })
                    }
                }
                
                searchSuggestions = {
                    didYouMean: querySuggestions.didYouMean,
                    suggestions: querySuggestions.suggestions,
                    keywordCorrections: keywordSuggestions
                }
            } catch (suggestionError) {
                console.error("Error getting suggestions:", suggestionError)
                // Don't block the response if suggestions fail
            }
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            properties: properties,
            filtersUsed: cleanFilters,
            totalProperties: properties.length,
            ...(searchSuggestions && { searchSuggestions })
        });

    } catch (error) {
        console.error("Lỗi trong naturalLanguageSearch:", error);
        next(error);
    }
}

const analyzePropertyImage = async (req, res, next) => {
    try {
        const { propertyId, imageId } = req.params
        const { imageUrl } = req.query // Get imageUrl from query params as fallback
        const userId = req.jwtDecoded._id
        
        // Get property using the same method as getUserPropertiesWithMedia
        // to ensure _id consistency
        const properties = await propertyService.getUserPropertiesWithMedia(userId)
        const property = properties.find(p => p._id.toString() === propertyId)
        
        if (!property) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Property not found"
            })
        }
        
        // Verify ownership (property.owner should exist since we queried by userId)
        if (!property.owner || property.owner.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You can only analyze images of your own properties"
            })
        }
        
        // Find image in property media
        // Since _id changes on each query, we use URL as fallback
        let mediaItem = null
        
        // First, try to find by _id (in case it matches)
        if (property.media && typeof property.media.id === 'function') {
            mediaItem = property.media.id(imageId)
        }
        
        // If not found by _id, try .find()
        if (!mediaItem && property.media) {
            mediaItem = property.media.find(item => {
                if (item._id) {
                    return item._id.toString() === imageId
                }
                return false
            })
        }
        
        // If still not found and imageUrl is provided, find by URL (most reliable)
        if (!mediaItem && imageUrl && property.media) {
            mediaItem = property.media.find(item => item.url === imageUrl)
        }
        
        // If still not found, query property directly from database
        if (!mediaItem) {
            const dbProperty = await propertyService.getPropertyById(propertyId)
            if (dbProperty && dbProperty.media) {
                // Try to find by _id
                if (typeof dbProperty.media.id === 'function') {
                    mediaItem = dbProperty.media.id(imageId)
                }
                if (!mediaItem) {
                    mediaItem = dbProperty.media.find(item => {
                        if (item._id) {
                            return item._id.toString() === imageId
                        }
                        return false
                    })
                }
                // If still not found and imageUrl is provided, find by URL
                if (!mediaItem && imageUrl) {
                    mediaItem = dbProperty.media.find(item => item.url === imageUrl)
                }
            }
        }
        
        if (!mediaItem) {
            console.error('[Analyze] Image not found. PropertyId:', propertyId, 'ImageId:', imageId, 'ImageUrl:', imageUrl)
            console.error('[Analyze] Available media _ids:', property.media?.map(m => m._id?.toString()))
            console.error('[Analyze] Available media urls:', property.media?.map(m => m.url))
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Image not found"
            })
        }
        
        // Analyze image with AI
        const analysis = await imageTaggingService.analyzeImageWithGemini(mediaItem.url)
        
        // Update property with analysis results (pass imageUrl as fallback)
        const updatedProperty = await propertyService.updateImageTags(propertyId, imageId, analysis, imageUrl || mediaItem.url)
        
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Image analyzed successfully",
            data: {
                imageId,
                ...analysis
            }
        })
    } catch (error) {
        console.error("Error analyzing property image:", error)
        next(error)
    }
}

const updatePropertyImageTags = async (req, res, next) => {
    try {
        const { propertyId, imageId } = req.params
        const userId = req.jwtDecoded._id
        const { tags, detectedObjects } = req.body
        
        // Verify ownership
        const property = await propertyService.getPropertyById(propertyId)
        
        if (!property) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Property not found"
            })
        }
        
        if (property.owner.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You can only update tags of your own properties"
            })
        }
        
        // Update tags
        const updatedProperty = await propertyService.updateImageTags(propertyId, imageId, {
            tags,
            detectedObjects,
            analyzed: true
        })
        
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Tags updated successfully",
            data: updatedProperty
        })
    } catch (error) {
        console.error("Error updating image tags:", error)
        next(error)
    }
}

const searchPropertiesByTag = async (req, res, next) => {
    try {
        const { tag } = req.query
        const { page = 1, limit = 12 } = req.query
        
        if (!tag) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Tag parameter is required"
            })
        }
        
        const result = await propertyService.searchPropertiesByImageTag(tag, parseInt(page), parseInt(limit))
        
        res.status(StatusCodes.OK).json({
            success: true,
            data: result
        })
    } catch (error) {
        console.error("Error searching properties by tag:", error)
        next(error)
    }
}

const getUserPropertiesWithMedia = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded._id
        
        const properties = await propertyService.getUserPropertiesWithMedia(userId)
        
        res.status(StatusCodes.OK).json({
            success: true,
            data: properties
        })
    } catch (error) {
        console.error("Error getting user properties with media:", error)
        next(error)
    }
}

const getAllUserImageTags = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded._id
        
        const tags = await propertyService.getAllImageTags(userId)
        
        res.status(StatusCodes.OK).json({
            success: true,
            data: tags
        })
    } catch (error) {
        console.error("Error getting user image tags:", error)
        next(error)
    }
}

const bulkAnalyzeImages = async (req, res, next) => {
    try {
        const { propertyId } = req.params
        const userId = req.jwtDecoded._id
        
        const property = await propertyService.getPropertyById(propertyId)
        
        if (!property) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Property not found"
            })
        }
        
        if (property.owner.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You can only analyze images of your own properties"
            })
        }
        
        // Get all unanalyzed images
        const unanalyzedImages = property.media.filter(media => 
            media.type.startsWith('image') && !media.analyzed
        )
        
        if (unanalyzedImages.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "All images already analyzed",
                data: { analyzed: 0, total: property.media.length }
            })
        }
        
        // Analyze each image
        const results = []
        for (const media of unanalyzedImages) {
            try {
                const analysis = await imageTaggingService.analyzeImageWithGemini(media.url)
                await propertyService.updateImageTags(propertyId, media._id, analysis)
                results.push({ imageId: media._id, success: true })
            } catch (error) {
                results.push({ imageId: media._id, success: false, error: error.message })
            }
        }
        
        res.status(StatusCodes.OK).json({
            success: true,
            message: `Analyzed ${results.filter(r => r.success).length} images`,
            data: {
                analyzed: results.filter(r => r.success).length,
                total: unanalyzedImages.length,
                results
            }
        })
    } catch (error) {
        console.error("Error bulk analyzing images:", error)
        next(error)
    }
}

const analyzeTemporaryImage = async (req, res, next) => {
    try {
        // uploadFiles middleware uses array, so files are in req.files
        const files = req.files
        
        if (!files || files.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "No image file provided"
            })
        }
        
        const file = files[0] // Get first file
        
        // Upload to cloudinary temporarily
        console.log('[Upload] Uploading file to Cloudinary:', file.originalname)
        const uploadResult = await mediaService.uploadPropertyImage([file], 'temp')
        
        if (!uploadResult || uploadResult.length === 0) {
            console.error('[Upload] Failed to upload to Cloudinary')
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Failed to upload image"
            })
        }
        
        const imageUrl = uploadResult[0].url
        console.log('[Upload] Image uploaded successfully:', imageUrl)
        
        // Analyze with AI
        console.log('[AI] Starting analysis with Gemini...')
        const analysis = await imageTaggingService.analyzeImageWithGemini(imageUrl)
        console.log('[AI] Analysis completed:', analysis)
        
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Image analyzed successfully",
            data: {
                imageUrl,
                ...analysis
            }
        })
    } catch (error) {
        console.error("Error analyzing temporary image:", error)
        next(error)
    }
}

const clearImageTags = async (req, res, next) => {
    try {
        const { propertyId, imageId } = req.params
        const userId = req.jwtDecoded._id
        
        // Verify ownership
        const property = await propertyService.getPropertyById(propertyId)
        
        if (!property) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Property not found"
            })
        }
        
        if (property.owner.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You can only clear tags of your own properties"
            })
        }
        
        // Clear all tags and objects
        const updatedProperty = await propertyService.updateImageTags(propertyId, imageId, {
            tags: [],
            detectedObjects: [],
            analyzed: false
        })
        
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Tags cleared successfully",
            data: updatedProperty
        })
    } catch (error) {
        console.error("Error clearing image tags:", error)
        next(error)
    }
}

const updateProperty = async (req, res, next) => {
  try {
    const { id: propertyId } = req.params
    const userId = req.jwtDecoded._id
    const updateData = req.body

    const updatedProperty = await propertyService.updateProperty(propertyId, userId, updateData)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Property updated successfully",
      data: updatedProperty
    })
  } catch (error) {
    next(error)
  }
}

const updatePropertyStatus = async (req, res, next) => {
  try {
    const { propertyId } = req.params
    const userId = req.jwtDecoded._id
    const { status } = req.body

    const updatedProperty = await propertyService.updatePropertyStatus(propertyId, userId, status)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProperty
    })
  } catch (error) {
    next(error)
  }
}

const updatePropertyVisibility = async (req, res, next) => {
  try {
    const { propertyId } = req.params
    const userId = req.jwtDecoded._id
    const { visibility } = req.body

    const updatedProperty = await propertyService.updatePropertyVisibility(propertyId, userId, visibility)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProperty
    })
  } catch (error) {
    next(error)
  }
}

const deleteProperty = async (req, res, next) => {
  try {
    const { id: propertyId } = req.params
    const userId = req.jwtDecoded._id

    await propertyService.deleteProperty(propertyId, userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Property deleted successfully"
    })
  } catch (error) {
    next(error)
  }
}

// Boost/Bump a property to top
const boostProperty = async (req, res, next) => {
    try {
        const propertyId = req.params.id
        const userId = req.jwtDecoded?._id

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ 
                success: false, 
                message: "Unauthorized" 
            })
        }

        // Get property and user
        const property = await propertyService.getPropertyById(propertyId)
        if (!property) {
            return res.status(StatusCodes.NOT_FOUND).json({ 
                success: false, 
                message: "Property not found" 
            })
        }

        // Check ownership
        if (property.owner.toString() !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({ 
                success: false, 
                message: "You can only boost your own properties" 
            })
        }

        // Check if property is active
        if (property.status !== 'active') {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                success: false, 
                message: "Only active properties can be boosted" 
            })
        }

        const user = await propertyService.getUserById(userId)
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ 
                success: false, 
                message: "User not found" 
            })
        }

        // Check if user prefers to use credits or balance
        const { useCredits, durationHours } = req.body
        // Default boost duration: 48 hours; validate to avoid NaN
        const parsedHours = Number(durationHours)
        const boostDuration = !isNaN(parsedHours) && parsedHours > 0 ? parsedHours : 48

        // Calculate boost fee based on membership and duration
        const membership = user.membershipLevel || 'basic'
        // Base fee is for 24h boost
        let base24hFee = 100000 // basic
        if (membership === 'premium') base24hFee = 50000
        else if (membership === 'standard') base24hFee = 75000

        const creditsNeeded = Math.max(1, Math.ceil(boostDuration / 24))
        // Duration multiplier: 24h=1.0, 48h=1.5, 72h=2.0
        let durationMultiplier = 1
        if (boostDuration <= 24) durationMultiplier = 1
        else if (boostDuration <= 48) durationMultiplier = 1.5
        else durationMultiplier = 2
        const boostFee = Math.round(base24hFee * durationMultiplier)
        
        if (useCredits) {
            if ((user.boostCredits || 0) < creditsNeeded) {
                return res.status(StatusCodes.PAYMENT_REQUIRED).json({
                    success: false,
                    message: `Insufficient boost credits: need ${creditsNeeded}`,
                    requiredCredits: creditsNeeded,
                    currentCredits: user.boostCredits || 0
                })
            }
            await propertyService.updateUser(userId, {
                boostCredits: (user.boostCredits || 0) - creditsNeeded
            })
        } else {
            // Use balance
            if (user.balance < boostFee) {
                return res.status(StatusCodes.PAYMENT_REQUIRED).json({
                    success: false,
                    message: "Insufficient balance to boost property",
                    required: boostFee,
                    currentBalance: user.balance
                })
            }

            // Deduct balance
            await paymentService.deductBalance({
                userId: userId,
                amount: boostFee,
                description: `Boost property - ${property.title}`,
                referenceId: propertyId
            })
        }

        // Update property with boost info
        const now = new Date()
        const expiresAt = new Date(now.getTime() + boostDuration * 60 * 60 * 1000)
        const updatedProperty = await propertyService.updateProperty(propertyId,userId, {
            bumpedAt: now,
            boostExpiresAt: expiresAt,
            bumpCount: (property.bumpCount || 0) + 1,
            lastBumpedBy: userId
        })

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Property boosted successfully",
            data: updatedProperty,
            feeCharged: useCredits ? 0 : boostFee,
            creditsUsed: useCredits ? creditsNeeded : 0,
            durationHours: boostDuration
        })
    } catch (error) {
        console.error("Error boosting property:", error)
        next(error)
    }
}

// Boost multiple properties at once
const boostMultipleProperties = async (req, res, next) => {
    try {
        const { propertyIds } = req.body
        const userId = req.jwtDecoded?._id

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ 
                success: false, 
                message: "Unauthorized" 
            })
        }

        if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                success: false, 
                message: "propertyIds must be a non-empty array" 
            })
        }

        const user = await propertyService.getUserById(userId)
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ 
                success: false, 
                message: "User not found" 
            })
        }

        // Get all properties
        const properties = await Promise.all(
            propertyIds.map(id => propertyService.getPropertyById(id))
        )

        // Validate ownership and status
        const invalidProperties = properties.filter(p => 
            !p || p.owner.toString() !== userId || p.status !== 'active'
        )

        if (invalidProperties.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                success: false, 
                message: "Some properties are invalid, not owned by you, or not active" 
            })
        }

        // Calculate total fee with bulk discount
        const membership = user.membershipLevel || 'basic'
        let baseFee = 100000
        if (membership === 'premium') baseFee = 50000
        else if (membership === 'standard') baseFee = 75000

        const count = propertyIds.length
        let discount = 0
        if (count >= 5) discount = 0.15 // 15% discount for 5+
        else if (count >= 3) discount = 0.10 // 10% discount for 3+

        const totalFee = Math.round(baseFee * count * (1 - discount))

        // Check balance
        if (user.balance < totalFee) {
            return res.status(StatusCodes.PAYMENT_REQUIRED).json({
                success: false,
                message: "Insufficient balance to boost properties",
                required: totalFee,
                currentBalance: user.balance
            })
        }

        // Deduct balance
        await paymentService.deductBalance({
            userId: userId,
            amount: totalFee,
            description: `Bulk boost ${count} properties`,
            referenceId: propertyIds[0]
        })

        // Update all properties
        const updatePromises = propertyIds.map(id => 
            propertyService.updateProperty(id, {
                bumpedAt: new Date(),
                bumpCount: properties.find(p => p._id.toString() === id).bumpCount + 1,
                lastBumpedBy: userId
            })
        )

        await Promise.all(updatePromises)

        res.status(StatusCodes.OK).json({
            success: true,
            message: `${count} properties boosted successfully`,
            count: count,
            totalFee: totalFee,
            discountPercent: Math.round(discount * 100)
        })
    } catch (error) {
        console.error("Error boosting multiple properties:", error)
        next(error)
    }
}

// Purchase boost package
const purchaseBoostPackage = async (req, res, next) => {
    try {
        const userId = req.jwtDecoded?._id
        const { packageType } = req.body // 'small', 'medium', 'large'

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ 
                success: false, 
                message: "Unauthorized" 
            })
        }

        const user = await propertyService.getUserById(userId)
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ 
                success: false, 
                message: "User not found" 
            })
        }

        // Define packages
        const packages = {
            small: { credits: 5, price: 400000 },
            medium: { credits: 10, price: 700000 },
            large: { credits: 20, price: 1200000 }
        }

        const selectedPackage = packages[packageType]
        if (!selectedPackage) {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                success: false, 
                message: "Invalid package type. Choose: small, medium, or large" 
            })
        }

        // Membership-based discount: basic 0%, standard 10%, premium 20%
        const level = user.membershipLevel || 'basic'
        const discountMap = { basic: 0, standard: 0.1, premium: 0.2 }
        const discountRate = discountMap[level] ?? 0
        const discountedPrice = Math.round(selectedPackage.price * (1 - discountRate))

        // Check balance
        if (user.balance < discountedPrice) {
            return res.status(StatusCodes.PAYMENT_REQUIRED).json({
                success: false,
                message: "Insufficient balance to purchase boost package",
                required: discountedPrice,
                currentBalance: user.balance
            })
        }

        // Deduct balance and add credits
        await paymentService.deductBalance({
            userId: userId,
            amount: discountedPrice,
            description: `Purchase boost package (${selectedPackage.credits} credits) - ${level} discount ${Math.round(discountRate*100)}%`,
            referenceId: userId
        })

        await propertyService.updateUser(userId, {
            boostCredits: (user.boostCredits || 0) + selectedPackage.credits
        })

        res.status(StatusCodes.OK).json({
            success: true,
            message: `Boost package purchased successfully`,
            credits: selectedPackage.credits,
            price: discountedPrice,
            newBalance: user.balance - discountedPrice,
            totalCredits: (user.boostCredits || 0) + selectedPackage.credits
        })
    } catch (error) {
        console.error("Error purchasing boost package:", error)
        next(error)
    }
}

export const propertyController = {
    createProperty,
    uploadPropertyMedia,
    verifyPropertyDocuments,
    getProperties,
    getPropertyDetails,
    getPropertiesWithinPolygon,
    getPropertiesWithMap,
    naturalLanguageSearch,
    analyzePropertyImage,
    updatePropertyImageTags,
    searchPropertiesByTag,
    getUserPropertiesWithMedia,
    getAllUserImageTags,
    bulkAnalyzeImages,
    analyzeTemporaryImage,
    clearImageTags,
    boostProperty,
    boostMultipleProperties,
    purchaseBoostPackage,
    updateProperty,
    updatePropertyStatus,
    updatePropertyVisibility,
    deleteProperty
}