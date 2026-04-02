import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join } from 'path';

// This forces dotenv to look in the root folder regardless of where the script runs
dotenv.config({ path: join(process.cwd(), '..', '.env') }); 

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not defined in your .env file.");
    return; // Don't exit process yet, let the server try to stay up
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Dermatics MongoDB Connected...");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};

export default connectDB;