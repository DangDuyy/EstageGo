import { StatusCodes } from "http-status-codes"
import { Types } from "mongoose"
import userModel from "~/models/users"
import { pagingSkipValue } from "~/utils/algorithms"
import ApiError from "~/utils/ApiError"
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE } from "~/utils/constants"

const { default: propertyModel } = require("~/models/properties")
const { slugify } = require("~/utils/formatter")

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
        const property = await propertyModel.findOne({_id: propertyId})

        if(!property){
            throw new ApiError(StatusCodes.NOT_FOUND, "Property not found")
        }

        // Add new media item
        property.media.push(...mediaItems)

        const updateProperty = await property.save()
        return updateProperty
    }
    catch(error){
        throw errors
    }
}

const getPropertyById = async (id) => {
    try{
        const property = await propertyModel.findById(id)
        return property
    }
    catch(error){
        throw error
    }
}

const getProperties = async (page, itemsPerPage, queryFilter = {}) => {
  try {
    // Chuẩn hóa paging
    const p = Math.max(1, parseInt(page ?? DEFAULT_PAGE, 10) || DEFAULT_PAGE);
    const limit = Math.max(1, parseInt(itemsPerPage ?? DEFAULT_ITEM_PER_PAGE, 10) || DEFAULT_ITEM_PER_PAGE);

    // Chuẩn hóa filter: _destroy và owner (nếu truyền string)
    const match = { _destroy: { $ne: true }, ...(queryFilter || {}) };
    if (match.owner && typeof match.owner === 'string') {
      try { match.owner = new Types.ObjectId(match.owner); } catch {}
    }

    const pipeline = [
      { $match: match },
      {
        $facet: {
          queryProperties: [
            {
              $lookup: {
                from: userModel.collection.name,
                let: { ownerId: '$owner' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } },
                  { $project: { password: 0, verifyToken: 0, __v: 0 } }
                ],
                as: 'ownerInfo'
              }
            },
            { $unwind: { path: '$ownerInfo', preserveNullAndEmptyArrays: true } },
            // sort an toàn kể cả khi không có owner
            { $skip: pagingSkipValue(p, limit) },
            { $limit: limit }
          ],
          queryTotalProperties: [
            { $count: 'countedAllProperties' }
          ]
        }
      }
    ];

    const [res] = await propertyModel
      .aggregate(pipeline)
      .collation({ locale: 'vi', strength: 1 });

    return {
      properties: res?.queryProperties ?? [],
      totalProperties: res?.queryTotalProperties?.[0]?.countedAllProperties ?? 0
    };
  } catch (error) {
    throw error; // giữ nguyên error gốc
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

export const propertyService = {
    createProperty,
    addMediaToProperty,
    getPropertyById,
    getProperties,
    getPropertyDetails
}