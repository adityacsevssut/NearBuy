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
    abortEarly: true,       // return first error only
    stripUnknown: true,     // remove unexpected fields silently
    errors: { label: "key" }
  });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.body = value; // use the sanitised/coerced value
  next();
};

module.exports = validate;
