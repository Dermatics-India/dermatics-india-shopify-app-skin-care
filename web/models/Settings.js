import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true }, // Links to your Shop table/domain
  widget: {
    displayType: { type: String, default: "icon" },
    buttonText: { type: String, default: "Analyze Skin" },
    bgColor: { type: String, default: "#000000" },
    textColor: { type: String, default: "#ffffff" },
    iconUrl: { type: String, default: "" },
    fontSize: { type: Number, default: 16 },
    fontWeight: { type: String, default: "normal" },
    paddingX: { type: Number, default: 24 },
    paddingY: { type: Number, default: 12 },
    radius: { type: Number, default: 30 },
  },
  drawer: {
    bgColor: { type: String, default: "#ffffff" },
    header: {
      fontFamily: { type: String, default: "sans-serif" },
      fontSize: { type: Number, default: 18 },
      textColor: { type: String, default: "#ffffff" },
      bgColor: { type: String, default: "#333333" },
    },
    bubble: {
      height: { type: Number, default: 60 },
      width: { type: String, default: "80%" },
      radius: { type: Number, default: 12 },
      bgColor: { type: String, default: "#f4f4f4" },
      textColor: { type: String, default: "#333333" },
      fontSize: { type: Number, default: 14 },
      fontWeight: { type: String, default: "normal" },
    },
  },
}, { timestamps: true });

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;