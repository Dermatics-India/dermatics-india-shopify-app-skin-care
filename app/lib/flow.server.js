import prisma from "../db.server";

// ---- POST /api/flow/session-start ----
export const startSession = async ({ shop }) => {
  const sessionId = `sess_${Date.now()}`;
  await prisma.userAnalysis.create({
    data: {
      sessionId,
      shop: shop || "unknown",
    },
  });

  return {
    session_id: sessionId,
    ui: {
      ui_type: "card_select",
      step_id: "choose_concern",
      heading: "Welcome!",
      message: "Please select a concern to begin.",
      options: [
        { id: "skin_assessment", label: "Skin Assessment", image: "" },
        { id: "hair_assessment", label: "Hair Assessment", image: "" },
      ],
    },
  };
};

// ---- POST /api/flow/submit ----
export const submitFlow = async ({ session_id, step_id, response }) => {
  await prisma.userAnalysis.updateMany({
    where: { sessionId: session_id },
    data: {
      concerns: { push: response },
    },
  });

  if (response === "hair_assessment") {
    return {
      ui: {
        ui_type: "pill_list",
        step_id: "past_hair_products",
        heading: "Step 1: Past Product Usage",
        message:
          "Tell us about products you've used. This helps us avoid recommending things that didn't work for you.",
        options: [
          "Anti-Dandruff Shampoo",
          "Hair Fall Serum",
          "Minoxidil",
          "Rosemary Oil",
          "Biotin Supplements",
          "Clarifying Shampoo",
          "None of these",
        ],
      },
    };
  }

  if (response === "skin_assessment" || step_id === "choose_concern") {
    return {
      ui: {
        ui_type: "pill_list",
        step_id: "past_skin_products",
        heading: "Step 1: Past Product Usage",
        message:
          "Tell us about products you've used. This helps us avoid recommending things that didn't work for you.",
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
          "None of these",
        ],
      },
    };
  }

  return { ui: { ui_type: "bot", message: "Processing..." } };
};

// ---- POST /api/flow/upload ----
export const uploadImage = async ({ flowType }) => {
  if (flowType === "hair_flow") {
    return {
      ui: {
        ui_type: "multi_select",
        step_id: "hair_goals",
        heading: "Step 3: Select Your Haircare Goals",
        message: "What results are you looking for regarding your hair?",
        options: [
          { id: "reduce_hairfall", label: "Reduce Hair Fall" },
          { id: "dandruff_control", label: "Control Dandruff" },
          { id: "hair_growth", label: "Promote New Growth" },
          { id: "scalp_health", label: "Soothe Flaky Scalp" },
        ],
      },
    };
  }

  return {
    ui: {
      ui_type: "multi_select",
      step_id: "skin_goals",
      heading: "Step 3: Select Your Skincare Goals",
      options: [
        { id: "texture", label: "Improve Skin Texture" },
        { id: "pores", label: "Minimize Pores" },
        { id: "glow", label: "Even Skin Tone" },
      ],
    },
  };
};
