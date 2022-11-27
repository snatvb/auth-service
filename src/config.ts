import * as joi from 'joi'

export const validationSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test'),
  JWT_AT_SECRET: joi.string().required(),
  JWT_EXPIRES: joi.string().required(),
  JWT_EMAIL_SECRET: joi.string().required(),
  JWT_EMAIL_EXPIRES: joi.string().required(),
  JWT_RECOVERY_SECRET: joi.string().required(),
  JWT_RECOVERY_EXPIRES: joi.string().required(),
  PORT: joi.number().default(3000),
  POSTGRES_PASSWORD: joi.string().required(),
  POSTGRES_USER: joi.string().required(),
  POSTGRES_DB: joi.string().required(),
  DATABASE_URL: joi.string().required(),
})
