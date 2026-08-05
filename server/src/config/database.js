const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
  };

  const connectWithRetry = () => {
    mongoose.connect(uri, options)
      .then(() => {
        console.log('Successfully connected to MongoDB');
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB, retrying in 5 seconds...', err.message);
        setTimeout(connectWithRetry, 5000);
      });
  };

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection lost. Reconnecting...');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  connectWithRetry();
};

module.exports = connectDB;
