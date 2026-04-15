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

console.log("DATABASE_URL from server.js:::", process.env.DATABASE_URL);

export const connectDB = async () => {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing in .env");
        process.exit(1);
    }
    console.log("Attempting to connect to DATABASE_URL:::", DATABASE_URL)
    try {
        await mongoose.connect(DATABASE_URL);
        console.log("MongoDB Connected...");
    } catch (err) {
        if (err.message.includes("ETIMEDOUT") || err.message.includes("target machine actively refused it")) {
            console.log("👉 ACTION REQUIRED: Your local Firewall or ISP is blocking Port 27017.");
            console.log("👉 TRY: Connecting to a mobile hotspot to verify.");
        }
        console.error("Database connection error:", err);
        process.exit(1);
    }
};