import { plansData } from "../constant/plans.js";

// Returns the merchant's Shop record with the current plan name injected and
// sensitive fields stripped. Matches the /api/shop response shape of the
// legacy Express backend.
export const getShopPayload = (shopRecord) => {
  const shopData = { ...shopRecord };
  delete shopData.accessToken;

  const planId = shopData.subscription?.planId;
  const plan = plansData.find((p) => p._id === planId);
  if (shopData.subscription) {
    shopData.subscription = {
      ...shopData.subscription,
      planName: plan?.name || "Free",
    };
  }

  return { success: true, data: shopData };
};
