const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./Config/env.js");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const shipmentRoutes = require("./routes/shipmentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
const corsOptions = {
  origin: "*", // allow all origins; you can replace '*' with your frontend URL for more security
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // allowed headers
  credentials: true, // if you want to allow cookies/auth headers
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/shipments", shipmentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "Backend Jinda hai", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = env.PORT;
const HOST = env.HOST;

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

module.exports = app;
