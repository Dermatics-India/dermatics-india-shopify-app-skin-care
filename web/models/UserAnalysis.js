import mongoose from 'mongoose';

const UserAnalysisSchema = new mongoose.Schema({
  shop: String,
  sessionId: String,
  concerns: [String], // e.g. ["minimize_pores", "even_skin_tone"]
  routine: Object,    // Stores the recommended products
  createdAt: { type: Date, default: Date.now }
});

export const UserAnalysis = mongoose.model('UserAnalysis', UserAnalysisSchema);