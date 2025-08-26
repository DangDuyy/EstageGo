import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from '~/utils/validators'
import { ObjectId } from 'mongodb'

const USER_ROLE = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
}
const USER_GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
}

const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
  password: Joi.string().required(),
  username: Joi.string().required().trim().strict().min(3).max(50),
  fullName: Joi.string().trim().default(null).max(120),
  avatar: Joi.string().default(null),
  phone: Joi.string().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE),
  gender: Joi.string().valid(...Object.values(USER_GENDER)).default(null),
  role: Joi.string().valid(...Object.values(USER_ROLE)).default(USER_ROLE.PATIENT),
  address: Joi.string().default(null),
  dob: Joi.date().timestamp('javascript').default('null'),
  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_VALUES = ['_id', 'username', 'createdAt', 'email']

const validateBeforeCreate = async(data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const findOneByEmail = async (email) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
      email: email
    })
    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (userId) => {
  try {
    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
      _id: userId
    })

    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
    return createUser
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (data, userId) => {
  try {
    Object.keys(data).forEach(fieldName => {
      if ((INVALID_UPDATE_VALUES).includes(fieldName))
        delete data[fieldName]
    })

    const result = await GET_DB().collection(USER_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: data },
      { returnDocument: 'after'}
    )

    return result || null
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  findOneByEmail,
  findOneById,
  createNew,
  update
}