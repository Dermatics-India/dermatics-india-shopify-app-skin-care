import { UserAnalysis } from "../models/UserAnalysis.js";

export const startSession = async (req, res) => {
    try {
        const sessionId = `sess_${Date.now()}`;
        await UserAnalysis.create({
            sessionId: sessionId,
            shop: req.body.shop || "unknown",
            status: "started"
        });

        res.json({
            session_id: sessionId,
            ui: {
                ui_type: "card_select",
                step_id: "choose_concern",
                heading: "Welcome!",
                message: "Please select a concern to begin.",
                options: [
                    { id: "skin_assessment", label: "Skin Assessment", image: "" },
                    { id: "hair_assessment", label: "Hair Assessment", image: "" }
                ]
            }
        });
    } catch (err) {
        console.error("Session Start Error:", err);
        res.status(500).json({ error: true });
    }
};

export const submitFlow = async (req, res) => {
    try {
        const { session_id, step_id, response } = req.body;

        // Update DB status
        await UserAnalysis.findOneAndUpdate(
            { sessionId: session_id },
            { $push: { concerns: response }, status: "in_progress" }
        );

        // 1. BRANCH: User chose Hair Analysis
        if (response === "hair_assessment") {
            return res.json({
                ui: {
                    ui_type: "pill_list",
                    step_id: "past_hair_products",
                    heading: "Step 1: Past Product Usage",
                    message: "Tell us about products you've used. This helps us avoid recommending things that didn't work for you.",
                    options: [
                        "Anti-Dandruff Shampoo", "Hair Fall Serum", "Minoxidil", "Rosemary Oil", "Biotin Supplements", "Clarifying Shampoo", "None of these"
                    ]
                }
            });
        }

        // 2. BRANCH: User chose Skin Analysis
        if (response === "skin_assessment" || step_id === "choose_concern") {
            return res.json({
                ui: {
                    ui_type: "pill_list",
                    step_id: "past_skin_products",
                    heading: "Step 1: Past Product Usage",
                    message: "Tell us about products you've used. This helps us avoid recommending things that didn't work for you.",
                    options: [
                        "Broad-Spectrum Sunscreen SPF 50",
                        "Gentle Hydrating Cleanser",
                        "Lightweight Moisturizer",
                        "Hyaluronic Acid Serum",
                        "Salicylic Acid Cleanser",
                        "Glycolic Acid Toner",
                        "Niacinamide Serum",
                        "Vitamin C Serum",
                        "Rich Moisturizer",
                        "Retinol Cream",
                        "None of these"
                    ]
                }
            });
        }

        res.json({ ui: { ui_type: "bot", message: "Processing..." } });
    } catch (err) {
        console.error("Submit Error:", err);
        res.status(500).json({ error: true });
    }
};

export const uploadImage = async (req, res) => {
    try {
        const { session_id, flowType } = req.body;

        // ... (Your AI processing logic here) ...

        if (flowType === "hair_flow") {
            return res.json({
                ui: {
                    ui_type: "multi_select",
                    step_id: "hair_goals",
                    heading: "Step 3: Select Your Haircare Goals",
                    message: "What results are you looking for regarding your hair?",
                    options: [
                        { id: "reduce_hairfall", label: "Reduce Hair Fall" },
                        { id: "dandruff_control", label: "Control Dandruff" },
                        { id: "hair_growth", label: "Promote New Growth" },
                        { id: "scalp_health", label: "Soothe Flaky Scalp" }
                    ]
                }
            });
        } else {
            // Default Skincare Goals
            return res.json({
                ui: {
                    ui_type: "multi_select",
                    step_id: "skin_goals",
                    heading: "Step 3: Select Your Skincare Goals",
                    options: [
                        { id: "texture", label: "Improve Skin Texture" },
                        { id: "pores", label: "Minimize Pores" },
                        { id: "glow", label: "Even Skin Tone" }
                    ]
                }
            });
        }
    } catch (e) {
        res.status(500).json({ error: true });
    }
};
