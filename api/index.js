const app = require('../server');
const { connectDB } = require('../config/database');

// Cached connection
let cachedConnection = null;

// Initialize database connection (cached for reuse)
const initializeDB = async () => {
  if (cachedConnection) {
    console.log('Using cached database connection');
    return cachedConnection;
  }

  try {
    console.log('Initializing new database connection');
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET
    });
    
    cachedConnection = await connectDB();
    return cachedConnection;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    cachedConnection = null; // Reset cache on error
    throw error;
  }
};

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://crm-frontend-omega-eight.vercel.app',
  'https://crm-frontend-git-main-officemailzebraffes-projects.vercel.app',
];

// Serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers immediately for all requests
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // Allow origin anyway to prevent blocking
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Ensure database is connected
    await initializeDB();

    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return detailed error in development, generic in production
    const isDev = process.env.NODE_ENV !== 'production';
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: isDev ? error.message : 'Something went wrong',
      ...(isDev && { stack: error.stack })
    });
  }
};
