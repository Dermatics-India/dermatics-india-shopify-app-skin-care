import mongoose from "mongoose";
import { PLAN_IDS } from "../constant/index.js";

const shopSchema = new mongoose.Schema({
    shop: { type: String, required: true, unique: true },
    accessToken: { type: String },
    isInstalled: { type: Boolean, default: false },
    installedAt: { type: Date, default: Date.now },
    permissions: {
        skinEnabled: { type: Boolean, default: true },
        hairEnabled: { type: Boolean, default: true },
    },
    settings: {
        appEmbedEnabled: { type: Boolean, default: false },
        isCustomized: { type: Boolean, default: false },
    },
    subscription: {
        id: { type: String, default: null },
        planId: { type: Number, default: PLAN_IDS.FREE },
        status: { type: String, default: null },
        activatedAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        // Trial window — set by Shopify when trialDays is passed to AppSubscriptionCreate.
        trialEndsAt: { type: Date, default: null },
        // Once a shop has consumed its trial we never grant another, even on re-subscribe.
        trialUsed: { type: Boolean, default: false },
    },
    // Rolling 30-day usage window for the current plan's quota.
    usage: {
        count: { type: Number, default: 0 },
        periodStart: { type: Date, default: Date.now },
    },
    uninstalledAt: { type: Date, default: null },
});

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export default Shop;
