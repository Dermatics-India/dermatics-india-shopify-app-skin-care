import mongoose from "mongoose";
import dotenv from "dotenv";
import { join } from "path";
import { UserAnalysis } from "./models/UserAnalysis.js";

dotenv.config({ path: join(process.cwd(), "..", ".env") });

const testDatabase = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("❌ No MONGODB_URI found.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB.");

        const testId = `test_sess_${Date.now()}`;
        const newEntry = await UserAnalysis.create({
            sessionId: testId,
            shop: "test-store.myshopify.com",
            status: "started",
            concerns: ["test_concern"]
        });

        console.log("✅ Successfully created entry:", newEntry);

        // Clean up
        await UserAnalysis.deleteOne({ sessionId: testId });
        console.log("✅ Successfully cleaned up test entry.");

        mongoose.connection.close();
    } catch (err) {
        console.error("❌ MongoDB Test failed:", err);
    }
};

testDatabase();
