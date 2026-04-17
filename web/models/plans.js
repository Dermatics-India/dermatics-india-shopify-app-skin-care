import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
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
        type: [String],
        required: true
    },
    featureKeys: {
        type: [String],
        default: []
    },
    isUnlimited: {
        type: Boolean,
        default: false
    },
    usageLimit: {
        type: Number,
        default: 0
    },
    trialDays: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: {
        versionKey: false,
        transform: (_doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        },
    },
});

const Plans = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plans;
