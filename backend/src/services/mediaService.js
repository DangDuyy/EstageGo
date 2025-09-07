import { cloudinaryProvider } from "~/providers/CloudinaryProvider"

const uploadPropertyImage = async (files, propertyId) => {
    const uploadOptions = {
        folder: `real-estate/properties/${propertyId}/images`,
        resource_type: 'auto'
    }

    const uploadResults = await cloudinaryProvider.uploadMultiple(files, uploadOptions)
    console.log(uploadResults)

    return uploadResults.map((result, index) => ({
        url: result.url,
        type: result.resource_type,
        metadata: {
          filename: files[index].originalname,
          size: result.bytes,
          mimetype: files[index].mimetype
        }
      }))
}

export const mediaService = {
    uploadPropertyImage
}