import { ZodError } from "zod";

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const data =
        source === "params"
          ? req.params
          : source === "query"
          ? req.query
          : req.body;

      const parsed = schema.parse(data);

      req[source] = parsed;

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues,
        });
      }

      return res.status(400).json({
        error: "Validation error",
        details: err.message,
      });
    }
  };
};
