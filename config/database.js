const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 5000) => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return mongoose.connection;
  }

  // Check if connecting
  if (mongoose.connection.readyState === 2) {
    console.log('⏳ MongoDB connection in progress...');
    // Wait for connection to establish
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
    return mongoose.connection;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 1,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB Connection Attempt ${i + 1}/${retries} failed: ${error.message}`);
      
      if (i === retries - 1) {
        console.error('❌ Could not connect to MongoDB after multiple attempts');
        // In serverless, throw error instead of exit
        if (process.env.VERCEL) {
          throw error;
        }
        process.exit(1);
      }
      
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

module.exports = { connectDB, closeDB };
