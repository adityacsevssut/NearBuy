/**
 * validate(schema) — Joi validation middleware factory
 * Usage: router.post("/route", validate(mySchema), handlerFn)
 *
 * Validates req.body against the Joi schema.
 * On failure → 400 { error: "human-readable message" }
 * On success → calls next()
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,      // return all errors
    allowUnknown: false,    // explicitly reject unexpected fields
    convert: true,          // allow string-to-number coercions for form-data
    errors: { label: "key" }
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ error: errorMessages.join(", ") });
  }

  req.body = value; // use the sanitised/coerced value
  next();
};

module.exports = validate;
