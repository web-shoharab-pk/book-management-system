import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').required(),
  DATABASE_URI: Joi.string()
    .uri({ scheme: ['mongodb'] })
    .required(),
  PORT: Joi.number().default(1234),
  API_PREFIX: Joi.string().default('api'),
});
