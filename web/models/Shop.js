import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    shop: { type: String, required: true, unique: true },
    accessToken: { type: String },
    isInstalled: { type: Boolean, default: true },
    permissions: {
        skinEnabled: { type: Boolean, default: true },
        hairEnabled: { type: Boolean, default: true },
    },
    extensions: {
        appEmebedEnabled: { type: Boolean, default: true },
    },
    plan: { type: String, default: "free" },
    installedAt: { type: Date, default: Date.now },
    uninstalledAt: { type: Date },
});

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export default Shop;