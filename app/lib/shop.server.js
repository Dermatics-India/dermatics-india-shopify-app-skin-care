import { plansData } from "../constant/plans.js";
import { getCurrentPlanId } from "./planHelper.server.js";

// Returns the merchant's Shop record with the current plan name injected and
// sensitive fields stripped. Matches the /api/shop response shape of the
// legacy Express backend.
//
// planName is derived from getCurrentPlanId — the same status-aware helper the
// Plans page uses — so a paid planId sitting on the row under a non-ACTIVE
// status (PENDING after a declined upgrade, stale after reinstall, etc.)
// resolves to Free. Without this, consumers like the Setup Guide header would
// display the stored planId's name while the rest of the app treats the shop
// as Free, and the two views disagree.
export const getShopPayload = (shopRecord) => {
  const shopData = { ...shopRecord };
  delete shopData.accessToken;

  const effectivePlanId = getCurrentPlanId(shopRecord);
  const plan = plansData.find((p) => p._id === effectivePlanId);
  if (shopData.subscription) {
    shopData.subscription = {
      ...shopData.subscription,
      planName: plan?.name || "Free",
    };
  }

  return { success: true, data: shopData };
};
