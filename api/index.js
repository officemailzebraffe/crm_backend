const app = require('../server');
const { connectDB } = require('../config/database');

// Cached connection
let cachedConnection = null;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://crm-frontend-omega-eight.vercel.app',
  'https://crm-frontend-git-main-officemailzebraffes-projects.vercel.app',
];

// Helper to set CORS headers
const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
};

// Initialize database connection (cached for reuse)
const initializeDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  // Check for required environment variables
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => 
      k.includes('MONGO') || k.includes('DATABASE') || k.includes('JWT') || k.includes('NODE')
    ));
    throw new Error('Database configuration missing. Please set MONGODB_URI in Vercel environment variables.');
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set!');
    throw new Error('JWT_SECRET missing. Please set it in Vercel environment variables.');
  }

  try {
    cachedConnection = await connectDB();
    return cachedConnection;
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    cachedConnection = null;
    throw error;
  }
};

// Serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers immediately for all requests
  setCorsHeaders(req, res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Debug endpoint to check environment
  if (req.url === '/api/debug-env') {
    return res.status(200).json({
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      clientUrl: process.env.CLIENT_URL,
    });
  }

  try {
    // Ensure database is connected
    await initializeDB();

    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Always return helpful error message for debugging
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      hint: 'Check Vercel environment variables: MONGODB_URI, JWT_SECRET'
    });
  }
};
