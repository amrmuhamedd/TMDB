import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  RT_SECRET: Joi.string().required(),
});
