const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.base': 'Username should be a type of text',
    'string.empty': 'Username cannot be empty',
    'string.min': 'Username should have a minimum length of {#limit}',
    'string.max': 'Username should have a maximum length of {#limit}',
    'any.required': 'Username is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.base': 'Password should be a type of text',
    'string.empty': 'Password cannot be empty',
    'string.min': 'Password should have a minimum length of {#limit}',
    'any.required': 'Password is required',
  }),
});

const signupSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'manager', 'citymanager', 'superagent', 'agent', 'player').default('player')
  });
  
module.exports = {
    loginSchema,
    signupSchema,
};
