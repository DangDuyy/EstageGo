import { cloudinaryProvider } from "~/providers/CloudinaryProvider"

const uploadPropertyImage = async (files, propertyId) => {
    const uploadOptions = {
        folder: `real-estate/properties/${propertyId}/images`
    }

    const uploadResults = await cloudinaryProvider.uploadMultiple(files, uploadOptions)
    // console.log(uploadResults)

    return uploadResults.map((result, index) => ({
        url: result.url,
        type: 'image',
        metadata: {
          filename: files[index].originalname,
          size: result.bytes,
          mimetype: files[index].mimetype,
        //   public_id: result.public_id,
        //   width: result.width,
        //   height: result.height,
        //   uploadedAt: new Date()
        }
      }))
}

export const mediaService = {
    uploadPropertyImage
}