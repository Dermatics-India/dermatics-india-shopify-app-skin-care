import shopify from "../shopify.js";
import { PLAN_NAMES, PLAN_INTERVALS } from "../constant/index.js";

// models 
import Plans from "../models/plans.js";


export const getPlans = async (req, res) => {
  try {
    const { shopRecord } = res.locals;

    const availablePlans = await Plans.find({}).lean();

    const currentPlanId = shopRecord?.activePlan || PLAN_NAMES.FREE;

    const plansWithStatus = availablePlans.map((plan) => {
      const isCurrent = plan.planId === currentPlanId;
      return {
        ...plan,
        current: isCurrent,
      };
    });

    res.json({
      success: true,
      plans: plansWithStatus,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
}

export const getPlanSubscriptionUrl = async (req, res) => {
  try {
    const { shopRecord } = res.locals;
    const { planId } = req.body;

    // 1. Fetch Plan from MongoDB
    const plan = await Plans.findOne({ planId: planId }).lean();
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // 2. Initialize Client
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });

    // 3. Clean up the Host and Return URL
    const cleanHost = shopify.api.config.hostName.replace(/^https?:\/\//, '');
    const returnUrl = `https://${cleanHost}/api/billing/confirm?shop=${shopRecord.shop}&planName=${encodeURIComponent(plan.name)}`;

    // 4. Execute Query
    // NOTE: Using client.request is the modern way for the Shopify Node API
    const response = await client.request(
      `mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: String!) {
    appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: true) {
      appSubscription { id }
      confirmationUrl
      userErrors { field message }
    }
  }`,
      {
        variables: {
          name: plan.planId,
          returnUrl: returnUrl,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: {
                    amount: parseFloat(plan.price).toFixed(2),
                    currencyCode: plan.currency || "USD"
                  },
                  interval: "EVERY_30_DAYS",
                },
              },
            },
          ],
        },
      }
    );

    // 5. Extract Data (In client.request, the body is the root)
    const { confirmationUrl, userErrors } = response.appSubscriptionCreate;

    if (userErrors && userErrors.length > 0) {
      console.error("Shopify validation errors:", userErrors);
      return res.status(400).json({ success: false, errors: userErrors });
    }

    // 6. Return URL to Frontend
    res.json({ success: true, url: confirmationUrl });

  } catch (error) {
    // This detail is vital for Windows/Local dev debugging
    if (error.response?.body?.errors) {
      console.error("GraphQL Errors:", JSON.stringify(error.response.body.errors, null, 2));
    } else {
      console.error("Billing Integration Error:", error);
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};