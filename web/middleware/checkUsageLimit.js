import {
  consumeUsage,
  getPlanForShop,
  isSubscriptionActive,
  planUnlocksFeature,
} from "../utils/planHelper.js";

/**
 * Gate a feature endpoint behind plan + quota.
 *
 * Usage:
 *   router.post('/scan', shopify.validateAuthenticatedSession(), checkShop,
 *     checkUsageLimit(FEATURE_KEYS.SKIN_ANALYSIS), handler);
 *
 * On success it attaches `plan` and `usage` to `res.locals` so the handler
 * can return remaining-quota info to the client.
 */
export const checkUsageLimit = (featureKey) => async (req, res, next) => {
  try {
    const shopRecord = res.locals.shopRecord;
    if (!shopRecord) {
      return res.status(401).json({ success: false, message: "Shop not loaded" });
    }

    const plan = await getPlanForShop(shopRecord);
    if (!plan) {
      return res.status(500).json({ success: false, message: "Plan not configured" });
    }

    if (!isSubscriptionActive(shopRecord)) {
      return res.status(402).json({
        success: false,
        code: "SUBSCRIPTION_INACTIVE",
        message: "Your subscription is not active. Please choose a plan.",
      });
    }

    if (featureKey && !planUnlocksFeature(plan, featureKey)) {
      return res.status(403).json({
        success: false,
        code: "FEATURE_NOT_IN_PLAN",
        message: `Your current plan does not include ${featureKey}. Upgrade to access this feature.`,
        plan: { id: plan._id, name: plan.name },
      });
    }

    const result = await consumeUsage(shopRecord, plan);
    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        code: "USAGE_LIMIT_REACHED",
        message: result.reason,
        usage: result.status,
      });
    }

    res.locals.plan = plan;
    res.locals.usage = result.status;
    next();
  } catch (err) {
    console.error("checkUsageLimit error:", err);
    next(err);
  }
};
