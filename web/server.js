import mongoose from "mongoose";
import dns from "dns";
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

export const connectDB = async () => {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing in .env");
        process.exit(1);
    }
    try {
        dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
        await mongoose.connect(DATABASE_URL);
        console.log("MongoDB Connected...");
    } catch (err) {
        if (err.message.includes("ETIMEDOUT") || err.message.includes("target machine actively refused it")) {
            console.log("👉 ACTION REQUIRED: Your local Firewall or ISP is blocking Port 27017.");
            console.log("👉 TRY: Connecting to a mobile hotspot to verify.");
        }
        if (err.syscall === "querySrv" || (err.code === "ECONNREFUSED" && String(err.message).includes("querySrv"))) {
            console.log("👉 DNS is refusing SRV lookups for MongoDB Atlas.");
            console.log("👉 TRY: switch networks, or swap DATABASE_URL in web/.env to the commented mongodb:// direct-hosts URI (no SRV lookup).");
        }
        console.error("Database connection error:", err);
        process.exit(1);
    }
};