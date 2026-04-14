import { AVAILABLE_PLANS } from "../constant/plans.js";

export const getPlans = async(req, res) => {
    try {
        const { shopRecord } = res.locals;

    // 1. Fetch the store's current plan from your MongoDB
    
    const currentPlanId = shopRecord?.activePlan || "Free";

    // 2. Map through available plans to add the 'current' flag dynamically
    const plansWithStatus = AVAILABLE_PLANS.map((plan) => ({
      ...plan,
      current: plan.id === currentPlanId,
    }));

    res.json({
      success: true,
      plans: plansWithStatus,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
}