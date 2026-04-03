import mongoose from "mongoose";
import { Session } from "@shopify/shopify-api";

import connectDB from "./db.js";

const ShopifySessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    shop: { type: String, required: true, index: true },
    // Store the full SessionParams object Shopify gives us.
    // Includes accessToken/onlineAccessInfo/expires/etc.
    sessionData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  {
    collection: "Stores",
    timestamps: true,
  }
);

const ShopifySessionModel =
  mongoose.models.ShopifySession ||
  mongoose.model("ShopifySession", ShopifySessionSchema);

export default class MongoSessionStorage {
  async storeSession(session) {
    const ok = await connectDB();
    if (!ok) {
      console.error("❌ [SessionStorage] Cannot store session — MongoDB not connected");
      throw new Error("MongoDB is not connected; cannot store Shopify session.");
    }

    const sessionParams = session.toObject();
    const { id, shop } = sessionParams;

    await ShopifySessionModel.updateOne(
      { id },
      { $set: { shop, sessionData: sessionParams } },
      { upsert: true }
    );

    console.log(`✅ [SessionStorage] Stored session: ${id} for shop: ${shop}`);
    return true;
  }

  async loadSession(id) {
    const ok = await connectDB();
    if (!ok) {
      console.warn("⚠️ [SessionStorage] Cannot load session — MongoDB not connected");
      return undefined;
    }

    const doc = await ShopifySessionModel.findOne({ id }).lean();
    if (!doc) {
      console.log(`⚠️ [SessionStorage] No session found for id: ${id}`);
      return undefined;
    }

    console.log(`✅ [SessionStorage] Loaded session: ${id}`);
    return new Session(doc.sessionData);
  }

  async deleteSession(id) {
    const ok = await connectDB();
    if (!ok) return false;

    const result = await ShopifySessionModel.deleteOne({ id });
    console.log(`🗑️ [SessionStorage] Deleted session: ${id} (count: ${result?.deletedCount ?? 0})`);
    return (result?.deletedCount ?? 0) > 0;
  }

  async deleteSessions(ids) {
    const ok = await connectDB();
    if (!ok) return false;

    if (!ids?.length) return true;
    const result = await ShopifySessionModel.deleteMany({ id: { $in: ids } });
    console.log(`🗑️ [SessionStorage] Deleted ${result?.deletedCount ?? 0} sessions`);
    return (result?.deletedCount ?? 0) > 0;
  }

  async findSessionsByShop(shop) {
    const ok = await connectDB();
    if (!ok) return [];

    const docs = await ShopifySessionModel.find({ shop }).lean();
    console.log(`🔍 [SessionStorage] Found ${docs.length} sessions for shop: ${shop}`);
    return docs.map((doc) => new Session(doc.sessionData));
  }
}
