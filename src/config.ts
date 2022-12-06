import * as joi from 'joi'

export const validationSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test'),
  PORT: joi.number().default(3000),

  JWT_AT_SECRET: joi.string().required(),
  JWT_EXPIRES: joi.string().required(),
  JWT_RT_EXPIRES: joi.number().required(),
  JWT_EMAIL_SECRET: joi.string().required(),
  JWT_EMAIL_EXPIRES: joi.string().required(),
  JWT_RECOVERY_SECRET: joi.string().required(),
  JWT_RECOVERY_EXPIRES: joi.string().required(),
  JWT_CHANGE_EMAIL_EXPIRES: joi.string().required(),
  JWT_CHANGE_EMAIL_SECRET: joi.string().required(),

  POSTGRES_PASSWORD: joi.string().required(),
  POSTGRES_USER: joi.string().required(),
  POSTGRES_DB: joi.string().required(),
  DATABASE_URL: joi.string().required(),

  MAILER_SERVICE: joi.string().required(),
  MAILER_HOST: joi.string().required(),
  MAILER_USER: joi.string().required(),
  MAILER_PASSWORD: joi.string().required(),
  MAILER_FROM: joi.string().required(),
  MAILER_RECOVERY_LINK_TEMPLATE: joi.string().required(),
  MAILER_CHANGE_EMAIL_LINK_TEMPLATE: joi.string().required(),
  MAILER_APP_NAME: joi.string().required(),
})
