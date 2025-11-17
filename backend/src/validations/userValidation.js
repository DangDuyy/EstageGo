import Joi from "joi"
import { StatusCodes } from "http-status-codes"
import ApiError from "~/utils/ApiError"
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from "~/utils/validators"

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE).allow(null, ''),
    phone: Joi.string().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE).allow(null, ''),
    userName: Joi.string().required().trim().min(3).max(50),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
    contactType: Joi.string().valid('email', 'phone').optional()
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    if (!req.body.email && !req.body.phone) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email or phone is required')
    }
    next()
  } catch (err) {
    next(err)
  }
}

const verifyAccount = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    token: Joi.string().required()
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    next()
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE).allow(null, ''),
    phone: Joi.string().pattern(PHONE_RULE).message(PHONE_RULE_MESSAGE).allow(null, ''),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
    contactType: Joi.string().valid('email', 'phone').optional()
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
    if (!req.body.email && !req.body.phone) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Email or phone is required')
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const userValidation = {
  createNew,
  verifyAccount,
  login
}