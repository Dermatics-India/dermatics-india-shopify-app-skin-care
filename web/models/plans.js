import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true // e.g., "COMBO"
    },
    name: {
        type: String,
        required: true // e.g., "Skin & Hair Combo"
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    interval: {
        type: String,
        enum: ['month', 'year'],
        default: 'month'
    },
    features: {
        type: [String], // Array of strings for the checkmarks
        required: true
    },
    isUnlimited: {
        type: Boolean,
        default: false
    },
    usageLimit: {
        type: Number,
        default: 0 // e.g., 100 for Free, 0 for unlimited
    }
}, { timestamps: true });

const Plans = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plans;