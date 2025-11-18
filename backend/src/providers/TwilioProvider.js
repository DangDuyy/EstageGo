const { env } = require('~/config/environment')
const twilio = require('twilio')

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

if (!accountSid || !authToken) {
  console.error('Twilio: ACCOUNT_SID or AUTH_TOKEN is missing. Check .env')
}

if (!serviceSid) {
  console.warn('Twilio: VERIFY_SERVICE_SID is not configured. phone verify will fail.')
}

let client
try {
  client = twilio(accountSid, authToken)
} catch (err) {
  console.error('Twilio client init error:', err)
  throw err
}

/**
 * Convert local Vietnam phone (0XXXXXXXXX) to international (+84XXXXXXXXX)
 * Keeps other formats unchanged.
 */
const convertToInternationalFormat = (phone) => {
  if (!phone) return phone
  // remove spaces, dashes, parentheses
  const cleaned = String(phone).replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+84')) return cleaned
  if (cleaned.startsWith('84')) return '+' + cleaned
  if (cleaned.startsWith('0')) return '+84' + cleaned.slice(1)
  return cleaned
}

const sendVerificationCode = async (phone) => {
  if (!serviceSid) throw new Error('Twilio Verify Service SID is not configured')
  if (!phone) throw new Error('Phone is required')

  // convert local 0... to +84...
  const to = convertToInternationalFormat(phone)
  console.log('Twilio: sending verification to', to)
  return client.verify.services(serviceSid).verifications.create({ to, channel: 'sms' })
}

const checkVerificationCode = async (phone, code) => {
  if (!serviceSid) throw new Error('Twilio Verify Service SID is not configured')
  if (!phone || !code) throw new Error('Phone and code are required')

  // convert local 0... to +84...
  const to = convertToInternationalFormat(phone)
  console.log('Twilio: checking code for', to)
  return client.verify.services(serviceSid).verificationChecks.create({ to, code })
}

module.exports = {
  sendVerificationCode,
  checkVerificationCode
}