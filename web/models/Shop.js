import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    shop: { type: String, required: true, unique: true },
    accessToken: { type: String },
    isInstalled: { type: Boolean, default: true },
    installedAt: { type: Date, default: Date.now },
    uninstalledAt: { type: Date },
});

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

export default Shop;