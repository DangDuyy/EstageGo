import { StatusCodes } from "http-status-codes"
import ApiError from "~/utils/ApiError"

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

export const propertyService = {
    createProperty,
    addMediaToProperty,
    getPropertyById
}