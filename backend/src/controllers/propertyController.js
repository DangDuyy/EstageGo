import { date } from "joi"
import { mediaService } from "~/services/mediaService"
import { toArr, toNum, toStr } from "~/utils/formatter"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchSuggestionService } from "~/services/searchSuggestionService"
import { propertyKnowledgeService } from "~/services/propertyKnowledgeService"

const { StatusCodes } = require("http-status-codes")
const { propertyService } = require("~/services/propertyService")

const createProperty = async (req, res, next) => {
    try {
        const objectFields = ["price", "address", "rooms"];
        objectFields.forEach((key) => {
            if (req.body[key]) req.body[key] = JSON.parse(req.body[key]);
        });

        const owner = req.jwtDecoded._id
        
        // Lấy thông tin user để xác định postType dựa trên membershipLevel
        const user = await propertyService.getUserById(owner)
        const postType = user?.membershipLevel === 'premium' ? 'vip' : 'normal'
        
        const propertyData = {
            ...req.body,
            owner,
            postType
        }

        console.log(propertyData)

        // 1. Tạo property
        const newProperty = await propertyService.createProperty(propertyData)

        // 2. Upload file
        const files = req.files || []
        const uploadResult = await mediaService.uploadPropertyImage(files, newProperty._id)

        // 3. Update property với media
        const updateProperty = await propertyService.addMediaToProperty(newProperty._id, uploadResult)
        res.status(StatusCodes.CREATED).json({
            succes: true,
            message: "Property created successfully",
            data: updateProperty
        })
    }
    catch (error) {
        console.log("Error property controlelr", error)
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

const getPropertiesWithinPolygon = async (req, res, next) => {
    try {
        const { polygon } = req.body;

        // Tạo GeoJSON polygon
        const polygonGeoJSON = {
            type: "Polygon",
            coordinates: [polygon], // Mảng 2D: [[lng, lat], ...]
        };

        const result = await propertyService.getPropertiesWithinPolygon(polygonGeoJSON)

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
        const apiKey = process.env.GEMINI_API_KEY;
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

export const propertyController = {
    createProperty,
    uploadPropertyMedia,
    getProperties,
    getPropertyDetails,
    getPropertiesWithinPolygon,
    naturalLanguageSearch
}