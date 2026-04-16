import mongoose from "mongoose";

const widgetSchema = new mongoose.Schema({
  position: { type: String, default: "bottom-right" },
  buttonText: { type: String, default: "Analyze Skin" },
  bgColor: { type: String, default: "#0084ff" },
  textColor: { type: String, default: "#ffffff" },
  fontSize: { type: Number, default: 16 },
  fontWeight: { type: String, default: "normal" },
  paddingX: { type: Number, default: 24 },
  paddingY: { type: Number, default: 12 },
  radius: { type: Number, default: 30 },
}, { _id: false });

const bubbleSchema = new mongoose.Schema({
  height: { type: Number, default: 60 },
  width: { type: String, default: "80%" },
  radius: { type: Number, default: 12 },
  bgColor: { type: String, default: "#f4f4f4" },
  textColor: { type: String, default: "#333333" },
  fontSize: { type: Number, default: 14 },
  fontWeight: { type: String, default: "normal" },
}, { _id: false })

const drawerSchema = new mongoose.Schema({
  bgColor: { type: String, default: "#ffffff" },
  header: {
    fontFamily: { type: String, default: "sans-serif" },
    fontSize: { type: Number, default: 18 },
    textColor: { type: String, default: "#ffffff" },
    bgColor: { type: String, default: "#0084ff" },
  },
  bubble: {
    boat: { type: bubbleSchema, default: () => ({ })},
    user: { type: bubbleSchema, default: () => ({ bgColor: "#0084ff", textColor: "#ffffff" })}
  },
}, { _id: false });

const moduleConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  text: {
    label: { type: String, default: "" },
    textColor: { type: String, default: "#333333" },
    fontSize: { type: Number, default: 14 },
    fontWeight: { type: String, default: "normal" },
  },
  image: {
    url: { type: String, default: "" },
    height: { type: Number, default: 50 },
    width: { type: Number, default: 50 },
    radius: { type: Number, default: 15 },
  },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, unique: true },
  widget: { type: widgetSchema, default: () => ({ buttonText: "Analyze Skin" }) },
  drawer: { type: drawerSchema, default: () => ({}) },
  modules: {
    skinCare: {
      type: moduleConfigSchema,
      default: () => ({
        enabled: true,
        text: { label: "Skin Analysis" },
      }),
    },
    hairCare: {
      type: moduleConfigSchema,
      default: () => ({
        enabled: true,
        text: { label: "Hair Analysis" },
      }),
    },
  }
}, { timestamps: true });

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
export default Settings;