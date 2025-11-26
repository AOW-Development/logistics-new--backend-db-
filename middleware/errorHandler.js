const multer = require("multer"); // ✅ Import multer

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // ✅ Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
    return res.status(400).json({ error: err.message });
  }

  // ✅ Default error handling
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
