import 'dotenv/config'

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,

  WEBSITE_DOMAIN_DEVELOPMENT: process.env.WEBSITE_DOMAIN_DEVELOPMENT,
  BUILD_MODE: process.env.BUILD_MODE,

  LOCAL_DEV_APP_HOST: process.env.LOCAL_DEV_APP_HOST,
  LOCAL_DEV_APP_PORT: process.env.LOCAL_DEV_APP_PORT,
  AUTHOR: process.env.AUTHOR,

  ACCESS_TOKEN_SECRET_SIGNATURE: process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE,
  REFRESH_TOKEN_SECRET_SIGNATURE: process.env.REFRESH_TOKEN_SECRET_SIGNATURE,
  REFRESH_TOKEN_LIFE: process.env.REFRESH_TOKEN_LIFE,

  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,

  OLLAMA_HOST: process.env.OLLAMA_HOST,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,

  // SMTP / Email: support both SMTP_* and EMAIL_* names
  SMTP_HOST: process.env.SMTP_HOST || process.env.EMAIL_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : process.env.EMAIL_PORT
    ? Number(process.env.EMAIL_PORT)
    : 587,
  SMTP_SECURE:
    (process.env.SMTP_SECURE || '').toLowerCase() === 'true' ||
    (process.env.EMAIL_PORT && Number(process.env.EMAIL_PORT) === 465),
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_SENDER || process.env.EMAIL_FROM || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_SENDER || '',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY
}