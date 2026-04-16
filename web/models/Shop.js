import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    shop: { type: String, required: true, unique: true },
    accessToken: { type: String },
    isInstalled: { type: Boolean, default: false },
    installedAt: { type: Date, default: Date.now },
    permissions: {
        skinEnabled: { type: Boolean, default: true },
        hairEnabled: { type: Boolean, default: true },
    },
    extensions: {
        appEmebedEnabled: { type: Boolean, default: false },
    },
    activePlan: { type: String, default: "free" },
    uninstalledAt: { type: Date, default: null },
});

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export default Shop;