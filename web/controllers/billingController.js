import shopify from "../shopify.js";
import {
  PLAN_IDS,
  PLAN_INTERVALS,
  SUBSCRIPTION_STATUS,
} from "../constant/index.js";

// models
import Plans from "../models/Plans.js";
import Shop from "../models/Shop.js";

// helpers
import {
  getCurrentPlanId,
  isInTrial,
  trialDaysRemaining,
  getUsageStatus,
  rolloverUsageIfExpired,
  resetUsageWindow,
} from "../utils/planHelper.js";

const isDev = process.env.NODE_ENV !== "production";

const getAppHost = () => {
  const raw = shopify.api.config.hostName || process.env.SHOPIFY_APP_URL || "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
};

const getEmbeddedAppUrl = (shop) => {
  const apiKey = shopify.api.config.apiKey;
  const host = Buffer.from(`${shop}/admin`).toString("base64").replace(/=+$/, "");
  return `https://${shop}/admin/apps/${apiKey}?host=${host}`;
};

/**
 * GET /api/plans
 * Returns the catalogue + the merchant's current plan/usage/trial state
 * so the UI can render everything in a single call.
 */
export const getPlans = async (req, res) => {
  try {
    const { shopRecord } = res.locals;

    // Roll the usage window forward lazily on read so the UI sees fresh numbers.
    if (rolloverUsageIfExpired(shopRecord)) {
      await Shop.updateOne(
        { _id: shopRecord._id },
        {
          "usage.count": shopRecord.usage.count,
          "usage.periodStart": shopRecord.usage.periodStart,
        },
      );
    }

    const availablePlans = await Plans.find({}).sort({ _id: 1 }).lean();
    const currentPlanId = getCurrentPlanId(shopRecord);
    const currentPlan = availablePlans.find((p) => p._id === currentPlanId);

    const plansWithStatus = availablePlans.map(({ _id, ...rest }) => ({
      ...rest,
      id: _id,
      current: _id === currentPlanId,
    }));

    const usage = getUsageStatus(shopRecord, currentPlan);
    const trial = {
      inTrial: isInTrial(shopRecord),
      daysRemaining: trialDaysRemaining(shopRecord),
      endsAt: shopRecord?.subscription?.trialEndsAt || null,
      used: Boolean(shopRecord?.subscription?.trialUsed),
    };

    res.json({
      success: true,
      plans: plansWithStatus,
      currentPlan: currentPlan
        ? {
            id: currentPlan._id,
            name: currentPlan.name,
            isUnlimited: currentPlan.isUnlimited,
            featureKeys: currentPlan.featureKeys || [],
          }
        : null,
      subscription: {
        status: shopRecord?.subscription?.status || null,
        activatedAt: shopRecord?.subscription?.activatedAt || null,
      },
      trial,
      usage,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

const cancelActiveSubscription = async (session, subscriptionId) => {
  if (!subscriptionId) return null;
  const client = new shopify.api.clients.Graphql({ session });
  const response = await client.request(
    `mutation AppSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription { id status }
        userErrors { field message }
      }
    }`,
    { variables: { id: subscriptionId } },
  );
  return response?.appSubscriptionCancel;
};

/**
 * POST /api/billing/subscription
 * - FREE plan: cancel any active sub, downgrade in DB, reset usage.
 * - Paid plan: create AppSubscription with trialDays (only if trial unused),
 *   return Shopify confirmationUrl. Trial state is finalized in /confirm.
 */
export const getPlanSubscriptionUrl = async (req, res) => {
  try {
    const { shopRecord } = res.locals;
    const session = res.locals.shopify.session;
    const planId = Number(req.body.planId);

    if (!planId || Number.isNaN(planId)) {
      return res.status(400).json({ success: false, message: "planId is required" });
    }

    if (planId === getCurrentPlanId(shopRecord)) {
      return res.status(400).json({ success: false, message: "Already on this plan" });
    }

    const plan = await Plans.findById(planId).lean();
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    if (plan._id === PLAN_IDS.FREE) {
      try {
        if (shopRecord.subscription?.id) {
          await cancelActiveSubscription(session, shopRecord.subscription.id);
        }
      } catch (err) {
        console.error("Cancel subscription error:", err.message);
      }

      await Shop.updateOne(
        { _id: shopRecord._id },
        {
          "subscription.id": null,
          "subscription.planId": PLAN_IDS.FREE,
          "subscription.status": SUBSCRIPTION_STATUS.CANCELLED,
          "subscription.cancelledAt": new Date(),
          "subscription.trialEndsAt": null,
          "usage.count": 0,
          "usage.periodStart": new Date(),
        },
      );

      return res.json({
        success: true,
        downgraded: true,
        url: null,
        message: "Downgraded to Free plan",
      });
    }

    // Only grant a trial if the shop hasn't already consumed one.
    const trialDays =
      !shopRecord.subscription?.trialUsed && plan.trialDays > 0 ? plan.trialDays : 0;

    const appHost = getAppHost();
    const returnUrl = `https://${appHost}/api/billing/confirm?shop=${encodeURIComponent(
      shopRecord.shop,
    )}&planId=${plan._id}`;

    const client = new shopify.api.clients.Graphql({ session });
    const response = await client.request(
      `mutation AppSubscriptionCreate(
        $name: String!,
        $lineItems: [AppSubscriptionLineItemInput!]!,
        $returnUrl: URL!,
        $test: Boolean,
        $trialDays: Int
      ) {
        appSubscriptionCreate(
          name: $name,
          lineItems: $lineItems,
          returnUrl: $returnUrl,
          test: $test,
          trialDays: $trialDays
        ) {
          appSubscription { id trialDays }
          confirmationUrl
          userErrors { field message }
        }
      }`,
      {
        variables: {
          name: plan.name,
          returnUrl,
          test: isDev,
          trialDays,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: {
                    amount: parseFloat(plan.price).toFixed(2),
                    currencyCode: plan.currency || "USD",
                  },
                  interval: PLAN_INTERVALS.EVERY_30_DAYS,
                },
              },
            },
          ],
        },
      },
    );

    const result = response?.appSubscriptionCreate;
    const { confirmationUrl, userErrors, appSubscription } = result || {};

    if (userErrors && userErrors.length > 0) {
      console.error("Shopify billing userErrors:", userErrors);
      return res.status(400).json({ success: false, errors: userErrors });
    }

    if (!confirmationUrl) {
      return res.status(500).json({ success: false, message: "No confirmation URL returned" });
    }

    await Shop.updateOne(
      { _id: shopRecord._id },
      {
        "subscription.id": appSubscription?.id || null,
        "subscription.status": SUBSCRIPTION_STATUS.PENDING,
      },
    );

    return res.json({ success: true, url: confirmationUrl, trialDays });
  } catch (error) {
    if (error.response?.body?.errors) {
      console.error("GraphQL Errors:", JSON.stringify(error.response.body.errors, null, 2));
    } else {
      console.error("Billing Integration Error:", error);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/billing/confirm
 * Top-frame redirect from Shopify after merchant approves the charge.
 * Loads the offline session, queries the AppSubscription (incl. trialDays
 * Shopify actually granted), updates DB, resets usage window for the new
 * billing cycle, and redirects back into the embedded admin app.
 */
export const confirmBilling = async (req, res) => {
  const { shop, charge_id: chargeId } = req.query;
  const planId = Number(req.query.planId);

  if (!shop || !planId || Number.isNaN(planId)) {
    return res.status(400).send("Missing shop or planId");
  }

  try {
    const sessionId = shopify.api.session.getOfflineId(shop);
    const session = await shopify.config.sessionStorage.loadSession(sessionId);
    if (!session) {
      return res.status(401).send("Session not found for shop");
    }

    const shopRecord = await Shop.findOne({ shop });
    if (!shopRecord) {
      return res.status(404).send("Shop not found");
    }

    const subscriptionId =
      shopRecord.subscription?.id ||
      (chargeId ? `gid://shopify/AppSubscription/${chargeId}` : null);

    if (!subscriptionId) {
      return res.status(400).send("No subscription to confirm");
    }

    const client = new shopify.api.clients.Graphql({ session });
    const response = await client.request(
      `query AppSubscription($id: ID!) {
        node(id: $id) {
          ... on AppSubscription {
            id name status createdAt trialDays currentPeriodEnd
          }
        }
      }`,
      { variables: { id: subscriptionId } },
    );

    const sub = response?.node;
    if (!sub) {
      return res.status(404).send("Subscription not found");
    }

    if (sub.status === SUBSCRIPTION_STATUS.ACTIVE) {
      const now = new Date();
      const trialEndsAt =
        sub.trialDays > 0
          ? new Date(now.getTime() + sub.trialDays * 24 * 60 * 60 * 1000)
          : null;

      await Shop.updateOne(
        { _id: shopRecord._id },
        {
          "subscription.id": sub.id,
          "subscription.planId": planId,
          "subscription.status": sub.status,
          "subscription.activatedAt": now,
          "subscription.cancelledAt": null,
          "subscription.trialEndsAt": trialEndsAt,
          ...(trialEndsAt ? { "subscription.trialUsed": true } : {}),
        },
      );

      // Fresh quota window starts when the new plan activates.
      await resetUsageWindow(shopRecord._id);
    } else {
      await Shop.updateOne(
        { _id: shopRecord._id },
        { "subscription.status": sub.status },
      );
    }

    return res.redirect(getEmbeddedAppUrl(shop));
  } catch (error) {
    console.error("Confirm billing error:", error);
    return res.status(500).send("Failed to confirm billing");
  }
};
