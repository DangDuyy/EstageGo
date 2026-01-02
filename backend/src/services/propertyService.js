import { StatusCodes } from "http-status-codes"
import { Types } from "mongoose"
import { ListingTierConfig } from "~/models/listingTierConfig"
import userModel from "~/models/users"
import { pagingSkipValue } from "~/utils/algorithms"
import ApiError from "~/utils/ApiError"
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE } from "~/utils/constants"
import userMembershipService from "./userMembershipService"
import SystemConfig from "~/models/systemConfig"

const { default: propertyModel } = require("~/models/properties")
const { slugify, escapeRegex, removeDiacritics, createFuzzyRegex } = require("~/utils/formatter")

const createProperty = async (propertyData) => {
  try {

    if (!await canCreateProperty(propertyData.owner)) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Property creation limit reached. Please upgrade your membership to post more properties.")
    }

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

    // const tierConfig = await ListingTierConfig.findById(newProperty.tier)

    // if (!tierConfig) {
    //   throw new Error('Listing tier config not found')
    // }

    // newProperty.priority = tierConfig.priority

    // const duration = tierConfig.durations.find(
    //   (d) => d._id.toString() === propertyData.durationId
    // )

    // if (!duration) {
    //   throw new Error('Invalid listing duration')
    // }

    // newProperty.expireAt = new Date(
    //   Date.now() + duration.days * 24 * 60 * 60 * 1000
    // )

    // newProperty.listingFee = duration.price

    // newProperty.isFeatured = tierConfig.features.featuredListing

    // await newProperty.save()

    return newProperty
  }
  catch (error) {
    throw error
  }
}

const canCreateProperty = async (userId) => {
  // 1. Kiểm tra hội viên
  const activeMembership = await userMembershipService.getActiveMembership(userId)

  if (activeMembership) {
    return true
  }

  // 2. Lấy số lượng tin miễn phí từ config hệ thống
  const DEFAULT_POST_LIMIT = await SystemConfig.findOne({ key: 'DEFAULT_POST_LIMIT' })
  const maxPost = DEFAULT_POST_LIMIT ?? 15

  // 3. Đếm số tin hiện có của user
  const currentPostCount = await propertyModel.countDocuments({
    owner: userId,
    _destroy: { $ne: true },
    $or: [
      { expireAt: null },
      { expireAt: { $gt: new Date() } }
    ]
  })

  if (currentPostCount >= maxPost) {
    return false
  }

  return true
}

const addMediaToProperty = async (propertyId, mediaItems, options = {}) => {
  const { session } = options
  
  try {
    const property = await propertyModel.findOne({ _id: propertyId }).session(session)

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found")
    }

    property.media.push(...mediaItems)
    const updateProperty = await property.save({ session })

    return updateProperty
  } catch (error) {
    console.error('Error in addMediaToProperty:', error)
    throw error
  }
}

const getPropertyById = async (id) => {
  try {
    const property = await propertyModel.findById(id)

    // Ensure all media items have _id (for old documents without _id)
    if (property && property.media && Array.isArray(property.media)) {
      let needsSave = false
      property.media.forEach((media) => {
        if (!media._id) {
          // Mongoose will auto-generate _id for subdocuments
          media._id = new Types.ObjectId()
          needsSave = true
        }
      })
      // Save property if any media items were missing _id
      if (needsSave) {
        await property.save()
      }
    }

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

    // const sort = {
    //   priority: -1,
    // }
    // const dir = (String(sortDir).toLowerCase() === "asc") ? 1 : -1
    // if (sortBy === "price") sort["price.value"] = dir
    // else if (sortBy === "area") sort["area"] = dir
    // else if (sortBy === "featured") {
    //   // Ưu tiên: 1) VIP + Boosted (còn hiệu lực), 2) Boosted, 3) VIP, 4) Normal
    //   // Tạo trường tính toán để xếp hạng: vip=2, boost active=1, cộng lại
    //   // Sẽ dùng $addFields trong pipeline thay vì sort trực tiếp
    //   // Tạm giữ sort cũ, sẽ thay bằng computed field trong pipeline
    //   sort["_sortPriority"] = -1
    //   sort["bumpedAt"] = -1
    //   sort["createdAt"] = -1
    // }
    // else sort["createdAt"] = dir // mặc định mới nhất

    // const pipeline = []

    // if (fuzzyOr.length) {
    //   pipeline.push({ $match: { $and: [match, { $or: fuzzyOr }] } })
    // } else {
    //   pipeline.push({ $match: match })
    // }

    // // Add computed sort priority for featured sorting
    // if (sortBy === "featured") {
    //   pipeline.push({
    //     $addFields: {
    //       _sortPriority: {
    //         $let: {
    //           vars: {
    //             isVip: { $eq: ["$postType", "vip"] },
    //             isBoostActive: {
    //               $and: [
    //                 { $ne: ["$boostExpiresAt", null] },
    //                 { $gt: ["$boostExpiresAt", new Date()] }
    //               ]
    //             }
    //           },
    //           in: {
    //             $cond: [
    //               // VIP + Active Boost = 4 points
    //               { $and: ["$$isVip", "$$isBoostActive"] }, 4,
    //               {
    //                 $cond: [
    //                   // Boost only (not VIP) = 2 points
    //                   { $and: ["$$isBoostActive", { $not: "$$isVip" }] }, 2,
    //                   {
    //                     $cond: [
    //                       // VIP only (no active boost) = 1 point
    //                       { $and: ["$$isVip", { $not: "$$isBoostActive" }] }, 1,
    //                       // Normal = 0 points
    //                       0
    //                     ]
    //                   }
    //                 ]
    //               }
    //             ]
    //           }
    //         }
    //       }
    //     }
    //   })
    // }


    // 2️⃣ Khởi tạo sort object
    const sort = {}

    // 3️⃣ Field user muốn sort
    if (sortBy === "price") sort["price.value"] = dir
    else if (sortBy === "area") sort["area"] = dir
    // else sort["createdAt"] = -1 // default

    // 4️⃣ Thêm các field hệ thống: luôn áp dụng
    // 4a: Boost active lên đầu
    sort["_boostPriority"] = -1
    // 4b: Priority break tie
    sort["priority"] = -1
    // 4c: createdAt tie-break cuối cùng
    sort["createdAt"] = -1

    // ---------------------------
    // 5️⃣ Pipeline
    const pipeline = []

    if (fuzzyOr.length) {
      pipeline.push({ $match: { $and: [match, { $or: fuzzyOr }] } })
    } else {
      pipeline.push({ $match: match })
    }

    // 6️⃣ Tính _boostPriority (1 nếu boost còn hiệu lực, 0 nếu không)
    pipeline.push({
      $addFields: {
        _boostPriority: {
          $cond: [
            {
              $and: [
                { $ne: ["$boostExpiresAt", null] },
                { $gt: ["$boostExpiresAt", new Date()] }
              ]
            },
            1,
            0
          ]
        }
      }
    })

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
        $match: {
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

const getPropertiesWithMapv1 = async (query) => {
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
      filter["address.province"] = {
        $regex: address.province,
        $options: "i"
      }
    }

    if (address.district) {
      filter["address.district"] = {
        $regex: address.district,
        $options: "i"
      }
    }

    if (address.ward) {
      filter["address.ward"] = {
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

  const properties = await propertyModel.find(filter)

  return properties
}

const MAP_MARKER_LIMIT = 300

const getPropertiesWithMap = async (query) => {
  const {
    regionSelection,
    address,

    page = 1,
    limit = 20,

    map, // { north, south, east, west }

    type,
    types,
    purpose,
    status,

    bedrooms, bedroomsMin, bedroomsMax,
    bathrooms, bathroomsMin, bathroomsMax,

    area, areaMin, areaMax,
    price, priceMin, priceMax,

    amenitiesAll,
    amenitiesAny,

    sortBy = "createdAt",
    sortDir = "desc"
  } = query

  const pageParam = Math.max(1, Number(page) || 1)
  const limitParam = Math.max(1, Number(limit) || 10)


  /* =======================
      1️⃣ BASE FILTER
  ======================== */
  const baseFilter = {}

  if (regionSelection) {
    baseFilter["address.province"] = {
      $regex: vnToRegex(regionSelection),
      $options: "i"
    }
  }

  if (address) {
    if (address.province)
      baseFilter["address.province"] = { $regex: address.province, $options: "i" }
    if (address.district)
      baseFilter["address.district"] = { $regex: address.district, $options: "i" }
    if (address.ward)
      baseFilter["address.ward"] = { $regex: address.ward, $options: "i" }
    if (address.street)
      baseFilter["address.street"] = { $regex: address.street, $options: "i" }
  }

  if (Array.isArray(types) && types.length) baseFilter.type = { $in: types }
  else if (type) baseFilter.type = type

  if (purpose) baseFilter.purpose = purpose
  if (status) baseFilter.status = status

  // bedrooms
  if (bedrooms != null) baseFilter["rooms.bedrooms"] = bedrooms
  else if (bedroomsMin != null || bedroomsMax != null) {
    baseFilter["rooms.bedrooms"] = {}
    if (bedroomsMin != null) baseFilter["rooms.bedrooms"].$gte = bedroomsMin
    if (bedroomsMax != null) baseFilter["rooms.bedrooms"].$lte = bedroomsMax
  }

  // bathrooms
  if (bathrooms != null) baseFilter["rooms.bathrooms"] = bathrooms
  else if (bathroomsMin != null || bathroomsMax != null) {
    baseFilter["rooms.bathrooms"] = {}
    if (bathroomsMin != null) baseFilter["rooms.bathrooms"].$gte = bathroomsMin
    if (bathroomsMax != null) baseFilter["rooms.bathrooms"].$lte = bathroomsMax
  }

  // area
  if (area != null) baseFilter.area = area
  else if (areaMin != null || areaMax != null) {
    baseFilter.area = {}
    if (areaMin != null) baseFilter.area.$gte = areaMin
    if (areaMax != null) baseFilter.area.$lte = areaMax
  }

  // price
  if (price != null) baseFilter["price.value"] = price
  else if (priceMin != null || priceMax != null) {
    baseFilter["price.value"] = {}
    if (priceMin != null) baseFilter["price.value"].$gte = priceMin
    if (priceMax != null) baseFilter["price.value"].$lte = priceMax
  }

  // amenities
  if (Array.isArray(amenitiesAll) && amenitiesAll.length)
    baseFilter.amenities = { $all: amenitiesAll }

  if (Array.isArray(amenitiesAny) && amenitiesAny.length)
    baseFilter.amenities = { ...(baseFilter.amenities || {}), $in: amenitiesAny }

  /* =======================
      2️⃣ SORT
  ======================== */
  const sort = {}

  // user sort (nếu có)
  if (sortBy === "price") {
    sort["price.value"] = sortDir === "asc" ? 1 : -1
  } else if (sortBy === "area") {
    sort["area"] = sortDir === "asc" ? 1 : -1
  }

  // system sort – LUÔN ÁP DỤNG
  sort["_boostPriority"] = -1   // boost active lên đầu
  sort["priority"] = -1         // hạng tin
  sort["createdAt"] = -1        // tie-break cuối

  /* =======================
      3️⃣ LIST
  ======================== */
  const skip = (pageParam - 1) * limitParam
  const pipeline = []

  // 2.1 Match
  pipeline.push({ $match: baseFilter })

  // 2.2 Tính boost priority
  pipeline.push({
    $addFields: {
      _boostPriority: {
        $cond: [
          {
            $and: [
              { $ne: ["$boostExpiresAt", null] },
              { $gt: ["$boostExpiresAt", "$$NOW"] }
            ]
          },
          1,
          0
        ]
      }
    }
  })

  // 2.3 Sort
  pipeline.push({ $sort: sort })

  // 2.4 Paging
  pipeline.push({ $skip: skip })
  pipeline.push({ $limit: limitParam })

  const listPromise = Promise.all([
    propertyModel.aggregate(pipeline),
    propertyModel.countDocuments(baseFilter)
  ])

  /* =======================
      4️⃣ MAP (NO ZOOM)
  ======================== */
  let mapResult = { markers: [], summary: null }

  // if (map) {
  //   const { north, south, east, west } = map

  //   const mapFilter = {
  //     ...baseFilter,
  //     location: {
  //       $geoWithin: {
  //         $box: [
  //           [west, south],
  //           [east, north]
  //         ]
  //       }
  //     }
  //   }

  //   // 🔑 COUNT FIRST
  //   const mapCount = await propertyModel.countDocuments(mapFilter)

  //   // 👉 Ít dữ liệu → marker
  //   if (mapCount <= MAP_MARKER_LIMIT) {
  //     mapResult.markers = await propertyModel
  //       .find(mapFilter)
  //       .select("_id location price address")
  //   }

  //   // 👉 Nhiều dữ liệu → summary
  //   else {
  //     mapResult.summary = await propertyModel.aggregate([
  //       { $match: mapFilter },
  //       {
  //         $group: {
  //           _id: {
  //             lat: { $round: [{ $divide: ["$location.coordinates.1", 0.05] }, 0] },
  //             lng: { $round: [{ $divide: ["$location.coordinates.0", 0.05] }, 0] }
  //           },
  //           count: { $sum: 1 },
  //           minPrice: { $min: "$price.value" }
  //         }
  //       },
  //       { $limit: 300 }
  //     ])
  //   }
  // }

  mapResult.markers = await propertyModel
    .find(baseFilter)
    .select("_id price address isFeatured")
    .sort({ priority: -1 })
    .limit(300) // HARD LIMIT chống lag

  /* =======================
      5️⃣ RESPONSE
  ======================== */
  const [items, total] = await listPromise

  return {
    list: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    },
    map: mapResult
  }
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

const updateImageTags = async (propertyId, imageId, tagsData, imageUrl = null) => {
  try {
    const property = await propertyModel.findById(propertyId)

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found")
    }

    // Find media item by _id first
    let mediaItem = null
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

    if (!mediaItem) {
      console.error('[UpdateImageTags] Image not found. PropertyId:', propertyId, 'ImageId:', imageId, 'ImageUrl:', imageUrl)
      console.error('[UpdateImageTags] Available media _ids:', property.media?.map(m => m._id?.toString()))
      console.error('[UpdateImageTags] Available media urls:', property.media?.map(m => m.url))
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
      _destroy: { $ne: true },
      'media.0': { $exists: true } // Only properties with at least one media
    })
      .select('_id title slug media createdAt owner')
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

const updateProperty = async (propertyId, userId, updateData) => {
  try {
    // First check if property exists and user is owner
    const existingProperty = await propertyModel.findOne({ _id: propertyId, owner: userId })

    if (!existingProperty) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found or unauthorized")
    }

    // Handle slug update if title changed
    if (updateData.title && updateData.title !== existingProperty.title) {
      const baseSlug = slugify(updateData.title, { lower: true, strict: true, locale: "vi" })
      let slug = baseSlug
      let counter = 1
      while (await propertyModel.findOne({ slug, _id: { $ne: propertyId } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      updateData.slug = slug
    }

    // Use findByIdAndUpdate to avoid triggering full validation (for legacy properties without tier)
    const property = await propertyModel.findByIdAndUpdate(
      propertyId,
      { $set: updateData },
      { new: true, runValidators: false }
    )

    return property
  } catch (error) {
    throw error
  }
}

const updatePropertyStatus = async (propertyId, userId, status) => {
  try {
    const property = await propertyModel.findOneAndUpdate(
      { _id: propertyId, owner: userId },
      { status },
      { new: true }
    )

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found or unauthorized")
    }

    return property
  } catch (error) {
    throw error
  }
}

const updatePropertyVisibility = async (propertyId, userId, visibility) => {
  try {
    const property = await propertyModel.findOneAndUpdate(
      { _id: propertyId, owner: userId },
      { visibility },
      { new: true }
    )

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found or unauthorized")
    }

    return property
  } catch (error) {
    throw error
  }
}

const deleteProperty = async (propertyId, userId) => {
  try {
    const property = await propertyModel.findOneAndUpdate(
      { _id: propertyId, owner: userId },
      { _destroy: true },
      { new: true }
    )

    if (!property) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Property not found or unauthorized")
    }

    return property
  } catch (error) {
    throw error
  }
}

const getPropertiesGroupedByProvince = async () => {
  try {
    const results = await propertyModel.aggregate([
      {
        $match: {
          status: 'active',
          'address.province': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$address.province',
          count: { $sum: 1 },
          sampleMedia: { $first: '$media' }
        }
      },
      {
        $project: {
          _id: 0,
          province: '$_id',
          count: 1,
          image: {
            $cond: [
              {
                $and: [
                  { $isArray: '$sampleMedia' },
                  { $gt: [{ $size: '$sampleMedia' }, 0] }
                ]
              },
              { $arrayElemAt: ['$sampleMedia.url', 0] },
              '$sampleMedia.url'
            ]
          }
        }
      },
      { $sort: { count: -1 } }
    ])

    return results
  } catch (error) {
    throw error
  }
}

const updateUser = async (userId, updateData) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    return user
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
  getPropertiesWithinPolygon,
  getUserById,
  getPropertiesByFilters,
  updateImageTags,
  searchPropertiesByImageTag,
  getUserPropertiesWithMedia,
  getAllImageTags,
  getPropertiesWithMap,
  getPropertiesGroupedByProvince,
  updateProperty,
  updatePropertyStatus,
  updatePropertyVisibility,
  deleteProperty,
  updateUser,
}