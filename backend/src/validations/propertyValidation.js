import Joi from "joi"

const getProperties = async (req, res, next) => {
  const correctConditon = await Joi.object({
    
  })
  try {
    next()
  } catch (error) {
    
  }
}

export const propertyValidation = {
  getProperties
}