import mongoose from "mongoose";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from the web folder to avoid root conflicts
dotenv.config({ path: join(__dirname, ".env") });
// Fallback check if already in web folder
if (!process.env.SHOPIFY_API_KEY) {
    dotenv.config();
}

console.log("MONGODB_URI from server.js:::", process.env.MONGODB_URI);

export const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log("Attempting to connect to MONGODB_URI:::", MONGODB_URI)
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
};