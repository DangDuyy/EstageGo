import { StatusCodes } from "http-status-codes"
import { Types } from "mongoose"
import userModel from "~/models/users"
import { pagingSkipValue } from "~/utils/algorithms"
import ApiError from "~/utils/ApiError"
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE } from "~/utils/constants"

const { default: propertyModel } = require("~/models/properties")
const { slugify, escapeRegex, removeDiacritics, createFuzzyRegex } = require("~/utils/formatter")

const createProperty = async (propertyData) => {
  try {
    // Tạo slug từ title
    const baseSlug = slugify(propertyData.title, {
      lower: true, // chuyển hết sang chữ thường
      strict: true, // loại bỏ kí tự đặc biệt
      locale: "vi" // hỗ trợ tiếng việt
    })

    // Đảm bảo slug unique
    let slug = baseSlug
    let counter = 1
    while (await propertyModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const propertyToCreate = {
      ...propertyData,
      slug
    }

    const newProperty = await propertyModel.create(propertyToCreate)

    return newProperty
  }
  catch (error) {
    throw error
  }
}

const addMediaToProperty = async (propertyId, mediaItems) => {
  try {
    const property = await propertyModel.findOne({ _id: propertyId })

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found")
    }

    // Add new media item
    property.media.push(...mediaItems)

    const updateProperty = await property.save()
    return updateProperty
  }
  catch (error) {
    throw errors
  }
}

const getPropertyById = async (id) => {
  try {
    const property = await propertyModel.findById(id)
    return property
  }
  catch (error) {
    throw error
  }
}

export const getProperties = async (page, itemsPerPage, queryFilter = {}) => {
  try {
    // 1) Chuẩn hoá paging
    const p = Math.max(1, parseInt(page ?? DEFAULT_PAGE, 10) || DEFAULT_PAGE)
    const limit = Math.max(1, parseInt(itemsPerPage ?? DEFAULT_ITEM_PER_PAGE, 10) || DEFAULT_ITEM_PER_PAGE)

    // 2) Bóc tách filter
    const {
      q,

      type,
      types,          // string[]
      purpose,        // 'sale' | 'rent'
      status,         // 'active' | 'hidden' | ...

      province,       // string
      provinces,      // string[]
      district,
      ward,

      bedrooms, bedroomsMin, bedroomsMax,
      bathrooms, bathroomsMin, bathroomsMax,

      area, areaMin, areaMax,
      price, priceMin, priceMax,

      amenitiesAll,   // string[]
      amenitiesAny,   // string[]

      owner,          // id string
      sortBy,         // 'price' | 'area' | 'createdAt'
      sortDir         // 'asc' | 'desc'
    } = queryFilter || {}

    const match = { 
      _destroy: { $ne: true },
      $or: [
        { expireAt: null },
        { expireAt: { $gt: new Date() } }
      ]
    }

    if (owner && typeof owner === "string") {
      try { match.owner = new Types.ObjectId(owner) } catch { }
    }

    if (Array.isArray(types) && types.length) {
      match.type = { $in: types }
    } else if (typeof type === "string" && type.trim()) {
      match.type = type.trim()
    }

    if (purpose) match.purpose = purpose
    if (status) match.status = status

    // 3.4) Địa chỉ (so sánh “nới” nhờ regex i + collation 'vi')
    if (province) match["address.province"] = { $regex: escapeRegex(province), $options: "i" }
    if (Array.isArray(provinces) && provinces.length) {
      match["address.province"] = { $in: provinces }
    }
    if (district) match["address.district"] = { $regex: escapeRegex(district), $options: "i" }
    if (ward) match["address.ward"] = { $regex: escapeRegex(ward), $options: "i" }

    if (typeof bedrooms === "number") match["rooms.bedrooms"] = bedrooms
    else {
      if (typeof bedroomsMin === "number") match["rooms.bedrooms"] = { ...(match["rooms.bedrooms"] || {}), $gte: bedroomsMin }
      if (typeof bedroomsMax === "number") match["rooms.bedrooms"] = { ...(match["rooms.bedrooms"] || {}), $lte: bedroomsMax }
    }

    if (typeof bathrooms === "number") match["rooms.bathrooms"] = bathrooms
    else {
      if (typeof bathroomsMin === "number") match["rooms.bathrooms"] = { ...(match["rooms.bathrooms"] || {}), $gte: bathroomsMin }
      if (typeof bathroomsMax === "number") match["rooms.bathrooms"] = { ...(match["rooms.bathrooms"] || {}), $lte: bathroomsMax }
    }

    // 3.6) Area
    if (typeof area === "number") match["area"] = area
    else {
      if (typeof areaMin === "number") match["area"] = { ...(match["area"] || {}), $gte: areaMin }
      if (typeof areaMax === "number") match["area"] = { ...(match["area"] || {}), $lte: areaMax }
    }

    // 3.7) Price.value
    if (typeof price === "number") match["price.value"] = price
    else {
      if (typeof priceMin === "number") match["price.value"] = { ...(match["price.value"] || {}), $gte: priceMin }
      if (typeof priceMax === "number") match["price.value"] = { ...(match["price.value"] || {}), $lte: priceMax }
    }

    // 3.8) Amenities
    if (Array.isArray(amenitiesAll) && amenitiesAll.length) {
      match["amenities"] = { ...(match["amenities"] || {}), $all: amenitiesAll }
    }
    if (Array.isArray(amenitiesAny) && amenitiesAny.length) {
      match["amenities"] = { ...(match["amenities"] || {}), $in: amenitiesAny }
    }

    const fuzzyOr = []
    if (q && String(q).trim()) {
      const rx = { $regex: escapeRegex(String(q).trim()), $options: "i" }
      fuzzyOr.push(
        { title: rx },
        { description: rx },
        { slug: rx },
        { "address.fullAddress": rx },
        { "address.province": rx },
        { "address.district": rx },
        { "address.ward": rx }
      )
    }

    const sort = {}
    const dir = (String(sortDir).toLowerCase() === "asc") ? 1 : -1
    if (sortBy === "price") sort["price.value"] = dir
    else if (sortBy === "area") sort["area"] = dir
    else if (sortBy === "featured") {
      // Ưu tiên VIP posts trước, sau đó sort theo createdAt
      sort["postType"] = -1 // vip trước normal
      sort["createdAt"] = -1
    }
    else sort["createdAt"] = dir // mặc định mới nhất

    const pipeline = []

    if (fuzzyOr.length) {
      pipeline.push({ $match: { $and: [match, { $or: fuzzyOr }] } })
    } else {
      pipeline.push({ $match: match })
    }

    pipeline.push(
      {
        $facet: {
          queryProperties: [
            { $sort: sort },
            {
              $lookup: {
                from: userModel.collection.name,
                let: { ownerId: "$owner" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
                  { $project: { password: 0, verifyToken: 0, __v: 0 } }
                ],
                as: "ownerInfo"
              }
            },
            { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } },
            { $skip: pagingSkipValue(p, limit) },
            { $limit: limit }
          ],
          queryTotalProperties: [
            { $count: "countedAllProperties" }
          ]
        }
      }
    )

    const [res] = await propertyModel.aggregate(pipeline).collation({ locale: "vi", strength: 1 })

    return {
      properties: res?.queryProperties ?? [],
      totalProperties: res?.queryTotalProperties?.[0]?.countedAllProperties ?? 0,
      page: p,
      itemsPerPage: limit
    }
  } catch (error) {
    throw error
  }
}

const getPropertyDetails = async (propertyId) => {
  try {
    if (!Types.ObjectId.isValid(propertyId))
      throw new Error('Invalid propertyId')

    const pineline = [
      { 
        $match : {
        _id: new Types.ObjectId(propertyId),
        _destroy: { $ne: true }
        } 
      },
      {
        $lookup: {
          from: userModel.collection.name,
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      },
      {
        $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          "ownerInfo.password": 0,
          "ownerInfo.verifyToken": 0,
          "ownerInfo.__v": 0
        }
      }
    ]

    const [result] = await propertyModel
      .aggregate(pineline)

    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

function vnToRegex(str) {
  const map = {
    a: "[aàáạảãâầấậẩẫăằắặẳẵ]",
    A: "[AÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]",
    e: "[eèéẹẻẽêềếệểễ]",
    E: "[EÈÉẸẺẼÊỀẾỆỂỄ]",
    i: "[iìíịỉĩ]",
    I: "[IÌÍỊỈĨ]",
    o: "[oòóọỏõôồốộổỗơờớợởỡ]",
    O: "[OÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]",
    u: "[uùúụủũưừứựửữ]",
    U: "[UÙÚỤỦŨƯỪỨỰỬỮ]",
    y: "[yỳýỵỷỹ]",
    Y: "[YỲÝỴỶỸ]",
    d: "[dđ]",
    D: "[DĐ]"
  };

  return str
    .split("")
    .map(c => map[c] || c)
    .join("\\s*"); // IMPORTANT: cho phép KHÔNG có khoảng trắng
}

const getPropertiesWithMap = async (query) => {
  const { regionSelection, address } = query
  let filter = {}

  if (regionSelection) {
    const pattern = vnToRegex(regionSelection)
    filter["address.province"] = {
      $regex: pattern,
      $options: "i"
    }
  }

  if (address) {
    if (address.province) {
      filter.province = {
        $regex: address.province,
        $options: "i"
      }
    }

    if (address.district) {
      filter.district = {
        $regex: address.district,
        $options: "i"
      }
    }

    if (address.ward) {
      filter.ward = {
        $regex: address.ward,
        $options: "i"
      }
    }

    if (address.street) {
      filter.street = {
        $regex: address.street,
        $options: "i"
      }
    }
  }

  console.log(filter)

  const properties = await propertyModel.find(filter)

  return properties
}

const getPropertiesWithinPolygon = async (polygonGeoJSON) => {
  if (!polygonGeoJSON || polygonGeoJSON.type !== "Polygon") {
    throw new Error("Invalid GeoJSON polygon");
  }

  // Spatial query MongoDB
  const properties = await propertyModel.find({
    "address.location": {
      $geoWithin: {
        $geometry: polygonGeoJSON
      }
    },
    _destroy: { $ne: true },
    $or: [
      { expireAt: null },
      { expireAt: { $gt: new Date() } }
    ]
  }).lean();

  return properties;
}

const getUserById = async (userId) => {
  try {
    const user = await userModel.findById(userId)
    return user
  } catch (error) {
    throw error
  }
}

const getPropertiesByFilters = async (filters) => {
  try {
    // Base conditions
    const baseConditions = {
      _destroy: { $ne: true }
    }
    
    const expireCondition = {
      $or: [
        { expireAt: null },
        { expireAt: { $gt: new Date() } }
      ]
    }

    // Separate $or from other filters
    const { $or: filterOr, ...otherFilters } = filters
    
    // Build final match
    let finalMatch
    
    if (filterOr && filterOr.length > 0) {
      // Nếu có $or từ AI filters, combine với expire check bằng $and
      finalMatch = {
        $and: [
          baseConditions,
          expireCondition,
          { ...otherFilters },
          { $or: filterOr }
        ]
      }
    } else {
      // Không có $or, merge bình thường
      finalMatch = {
        ...baseConditions,
        ...expireCondition,
        ...otherFilters
      }
    }

    // Log để debug
    console.log("Final match filters:", JSON.stringify(finalMatch, null, 2))

    const pipeline = [
      { $match: finalMatch },
      { $sort: { createdAt: -1 } }, // Mới nhất trước
      { $limit: 50 }, // Giới hạn kết quả
      {
        $lookup: {
          from: userModel.collection.name,
          let: { ownerId: "$owner" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
            { $project: { password: 0, verifyToken: 0, __v: 0 } }
          ],
          as: "ownerInfo"
        }
      },
      { $unwind: { path: "$ownerInfo", preserveNullAndEmptyArrays: true } }
    ]

    const properties = await propertyModel.aggregate(pipeline).collation({ locale: "vi", strength: 1 })

    return properties
  } catch (error) {
    console.error("Error in getPropertiesByFilters:", error)
    throw error
  }
}

const updateImageTags = async (propertyId, imageId, tagsData) => {
    try {
        const property = await propertyModel.findById(propertyId)
        
        if (!property) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Property not found")
        }
        
        const mediaItem = property.media.id(imageId)
        
        if (!mediaItem) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Image not found")
        }
        
        // Update tags
        if (tagsData.tags) {
            mediaItem.tags = tagsData.tags
        }
        
        // Update detected objects
        if (tagsData.detectedObjects) {
            mediaItem.detectedObjects = tagsData.detectedObjects
        }
        
        // Mark as analyzed
        mediaItem.analyzed = tagsData.analyzed !== undefined ? tagsData.analyzed : true
        mediaItem.analyzedAt = new Date()
        
        await property.save()
        
        return property
    } catch (error) {
        throw error
    }
}

const searchPropertiesByImageTag = async (tagLabel, page = 1, limit = 12) => {
    try {
        const skip = (page - 1) * limit
        
        const properties = await propertyModel.find({
            'media.tags.label': { $regex: new RegExp(tagLabel, 'i') }
        })
        .populate('owner', 'firstName lastName email avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        
        const total = await propertyModel.countDocuments({
            'media.tags.label': { $regex: new RegExp(tagLabel, 'i') }
        })
        
        return {
            properties,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        throw error
    }
}

const getUserPropertiesWithMedia = async (userId) => {
    try {
        const properties = await propertyModel.find({
            owner: userId,
            'media.0': { $exists: true } // Only properties with at least one media
        })
        .select('_id title slug media createdAt')
        .sort({ createdAt: -1 })
        
        return properties
    } catch (error) {
        throw error
    }
}

const getAllImageTags = async (userId) => {
    try {
        const properties = await propertyModel.find({
            owner: userId
        }).select('media.tags')
        
        const allTags = []
        properties.forEach(property => {
            property.media.forEach(media => {
                if (media.tags && media.tags.length > 0) {
                    allTags.push(...media.tags)
                }
            })
        })
        
        // Count and aggregate tags
        const tagMap = new Map()
        allTags.forEach(tag => {
            const label = tag.label.toLowerCase()
            if (!tagMap.has(label)) {
                tagMap.set(label, {
                    label,
                    count: 0,
                    sources: { ai: 0, manual: 0 }
                })
            }
            const existing = tagMap.get(label)
            existing.count++
            existing.sources[tag.source]++
        })
        
        return Array.from(tagMap.values()).sort((a, b) => b.count - a.count)
    } catch (error) {
        throw error
    }
}

export const propertyService = {
    createProperty,
    addMediaToProperty,
    getPropertyById,
    getProperties,
    getPropertyDetails,
    getPropertiesWithinPolygon
}