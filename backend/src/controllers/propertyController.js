import { date } from "joi"
import { mediaService } from "~/services/mediaService"

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
        //pagination
        const { page, itemsPerPage, q} = req.query
        const queryFilter = q
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