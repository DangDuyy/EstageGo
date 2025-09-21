import { date } from "joi"
import { mediaService } from "~/services/mediaService"
import { toArr, toNum, toStr } from "~/utils/formatter"

const { StatusCodes } = require("http-status-codes")
const { propertyService } = require("~/services/propertyService")

const createProperty = async (req, res, next) => {
    try {
        const owner = req.jwtDecoded._id
        const propertyData = {
            ...req.body,
            owner
        }

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
      status:  raw.status ? String(raw.status).trim().toLowerCase() : undefined,

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
    return res.status(StatusCodes.OK).json(result)
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
export const propertyController = {
    createProperty,
    uploadPropertyMedia,
    getProperties,
    getPropertyDetails
}