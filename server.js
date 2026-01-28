const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create a .env file with the required variables');
  // Don't exit in Vercel environment - throw error instead
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

const app = express();

/* =========================
   MIDDLEWARE
========================= */

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5000',
];

// Add production origins if specified
if (process.env.PRODUCTION_URL) {
  allowedOrigins.push(process.env.PRODUCTION_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

/* =========================
   ROUTES
========================= */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/leads", require("./routes/leads"));
app.use("/api/students", require("./routes/students"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/interactions", require("./routes/interactions"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/users", require("./routes/users"));

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", (req, res) => {
  const mongoose = require("mongoose");
  res.status(200).json({
    status: "running",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   ERROR HANDLER (LAST)
========================= */

app.use(errorHandler);

/* =========================
   EXPORT FOR VERCEL
========================= */

module.exports = app;
