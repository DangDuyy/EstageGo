import Joi from "joi"
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from "~/utils/validators"

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    username: Joi.string().required().trim().strict().min(3).max(50),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE)
  })
  try {
    await correctCondition.validateAsync(req.body, {
      abortEarly: false
    })
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
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE)
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

export const userValidation = {
  createNew,
  verifyAccount,
  login
}