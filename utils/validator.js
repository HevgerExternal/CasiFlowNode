const validate = (schema, payload) => {
    const { error, value } = schema.validate(payload, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
      }));
      const err = new Error('Validation Error');
      err.statusCode = 400;
      err.errors = errors;
      throw err;
    }
    return value;
  };
  
  module.exports = validate;
  