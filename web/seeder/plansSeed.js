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
    await mongoose.connect(process.env.DATABASE_URL);
    
    // 1. Clear existing plans to avoid unique constraint errors (planId)
    await Plans.deleteMany({});
    console.log('--- Old plans Removed ---');

    // 2. Insert the new data
    await Plans.insertMany(plansData);
    console.log('--- Database Seeded Successfully! ---');

    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();