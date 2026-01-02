import { cloudinaryProvider } from "~/providers/CloudinaryProvider"

const uploadPropertyImage = async (files, propertyId) => {
    const uploadOptions = {
        folder: `real-estate/properties/${propertyId}/images`,
        resource_type: 'auto'
    }

    const uploadResults = await cloudinaryProvider.uploadMultiple(files, uploadOptions)
    
    const mapped = uploadResults.map((result, index) => {
        const file = files[index]
        const type = file.mimetype.startsWith('video/') ? 'video' : 'image'
        
        return {
            url: result.url,
            publicId: result.public_id,
            type: type,
            metadata: {
                filename: file.originalname,
                size: result.bytes,
                mimetype: file.mimetype
            }
        }
    })
    
    return mapped
}

const uploadReviewImages = async (files, userId) => {
    const uploadOptions = {
        folder: `real-estate/reviews/${userId}/images`,
        resource_type: 'auto'
    }

    const uploadResults = await cloudinaryProvider.uploadMultiple(files, uploadOptions)

    return uploadResults.map((result, index) => ({
        url: result.url,
        type: result.resource_type === 'image' ? 'image' : 'video',
        metadata: {
          filename: files[index].originalname,
          size: result.bytes,
          mimetype: files[index].mimetype
        }
      }))
}

export const mediaService = {
    uploadPropertyImage,
    uploadReviewImages
}