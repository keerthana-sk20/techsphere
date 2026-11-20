export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "Image must be 5 MB or smaller." });
  if (error.status >= 400 && error.status < 500) return res.status(error.status).json({ message: error.message });
  if (error.name === "ValidationError") return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(" ") });
  if (error.code === 11000) return res.status(409).json({ message: "A record with that unique value already exists." });
  if (error.name === "CastError") return res.status(400).json({ message: "The requested record is invalid." });
  if (error.message === "Unsupported image type.") return res.status(400).json({ message: error.message });
  console.error(error);
  res.status(500).json({ message: "An unexpected server error occurred." });
}
