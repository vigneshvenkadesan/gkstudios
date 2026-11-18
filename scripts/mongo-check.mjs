import mongoose from 'mongoose';

const uri = process.env.MONGODB_STANDARD_URI || process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || 'gk_studios';

if (!uri) throw new Error('MONGODB_URI or MONGODB_STANDARD_URI is missing');

await mongoose.connect(uri, {
  dbName: databaseName,
  serverSelectionTimeoutMS: 15000,
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
});

await mongoose.connection.db.admin().ping();
console.log(`Connected to MongoDB database: ${databaseName}`);
await mongoose.disconnect();
