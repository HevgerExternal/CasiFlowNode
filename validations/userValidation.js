const Joi = require("joi");

const userCreationSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username should have a minimum length of 3",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password should have a minimum length of 6",
  }),
  role: Joi.string()
    .valid("admin", "manager", "citymanager", "superagent", "agent", "player")
    .required(),
});

module.exports = userCreationSchema;
