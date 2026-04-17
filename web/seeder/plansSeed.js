import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

// data 
import { plansData } from '../constant/plans.js';

// models 
import Plans from '../models/plans.js';

const seedDatabase = async () => {
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    const DATABASE_NAME = process.env.DATABASE_NAME;
    await mongoose.connect(DATABASE_URL,  { dbName: DATABASE_NAME });
    
    // 1. Clear existing plans to avoid duplicate _id on re-seed
    await Plans.deleteMany({});
    console.log('--- Old plans Removed ---');

    // 2. Insert the new data
    await Plans.insertMany(plansData);
    console.log('--- Database Seeded Successfully! ---');

    process.exit();
  } catch (error) {
    console.error('Error seeding Plans:', error);
    process.exit(1);
  }
};

seedDatabase();