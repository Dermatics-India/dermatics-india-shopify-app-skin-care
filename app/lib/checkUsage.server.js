import {
  consumeUsage,
  getPlanForShop,
  isSubscriptionActive,
  planUnlocksFeature,
} from "./planHelper.server.js";

// Gate a feature endpoint behind plan + quota. Call from a Remix action
// before doing the actual work, and use the returned `{ ok, response, plan,
// usage }` tuple to either bail or continue.
export const checkUsageLimit = async ({ shopRecord, featureKey }) => {
  if (!shopRecord) {
    return {
      ok: false,
      response: Response.json(
        { success: false, message: "Shop not loaded" },
        { status: 401 },
      ),
    };
  }

  const plan = await getPlanForShop(shopRecord);
  if (!plan) {
    return {
      ok: false,
      response: Response.json(
        { success: false, message: "Plan not configured" },
        { status: 500 },
      ),
    };
  }

  if (!isSubscriptionActive(shopRecord)) {
    return {
      ok: false,
      response: Response.json(
        {
          success: false,
          code: "SUBSCRIPTION_INACTIVE",
          message: "Your subscription is not active. Please choose a plan.",
        },
        { status: 402 },
      ),
    };
  }

  if (featureKey && !planUnlocksFeature(plan, featureKey)) {
    return {
      ok: false,
      response: Response.json(
        {
          success: false,
          code: "FEATURE_NOT_IN_PLAN",
          message: `Your current plan does not include ${featureKey}. Upgrade to access this feature.`,
          plan: { id: plan.id, name: plan.name },
        },
        { status: 403 },
      ),
    };
  }

  const result = await consumeUsage(shopRecord, plan);
  if (!result.allowed) {
    return {
      ok: false,
      response: Response.json(
        {
          success: false,
          code: "USAGE_LIMIT_REACHED",
          message: result.reason,
          usage: result.status,
        },
        { status: 429 },
      ),
    };
  }

  return { ok: true, plan, usage: result.status };
};
