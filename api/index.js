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

// Serverless function handler
module.exports = async (req, res) => {
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
