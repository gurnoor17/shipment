import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipment_manager';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// @ts-expect-error - mongoose is attached to the global object in dev
let cached = global.mongoose;

if (!cached) {
  // @ts-expect-error - mongoose is attached to the global object in dev
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
