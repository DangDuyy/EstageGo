const { StatusCodes } = require("http-status-codes")
const { propertyService } = require("~/services/propertyService")

const createProperty = async (req, res, next) => {
    try{
        console.log(req.body)
        const owner = req.jwtDecoded._id
        const propertyData = {
            ...req.body,
            owner
        }

        const newProperty = await propertyService.createProperty(propertyData)
        res.status(StatusCodes.CREATED).json({
            succes: true,
            message: "Property created successfully",
            data: newProperty
        })
    }
    catch(error){
        next(error)
    }
}

export const propertyController = {
    createProperty
}