// import {
//   Page,
//   Card,
//   Text,
//   Button,
//   Badge,
//   Divider,
//   Box,
// } from "@shopify/polaris";
// import { useState } from "react";

// export default function PricingPage() {
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const isYearly = billingCycle === "yearly";

//   const plans = [
//     {
//       name: "Free",
//       price: "$0/mo",
//       description: "For discovering New-Derma.",
//       buttonLabel: "Current Plan",
//       features: [
//         "Basic AI widget",
//         "100 requests/mo",
//         "Basic customization",
//         "Email support",
//       ],
//     },
//     {
//       name: "Starter",
//       price: isYearly ? "$13.68/mo" : "$17.1/mo",
//       badge: "Most Popular",
//       description: "For growing stores that want more AI power.",
//       buttonLabel: "Choose Starter",
//       highlighted: true,
//       features: [
//         "Full AI widget",
//         "3,000 requests/mo",
//         "Advanced customization",
//         "Remove branding",
//         "Live chat support",
//       ],
//     },
//     {
//       name: "Growth",
//       price: isYearly ? "$35.28/mo" : "$44.1/mo",
//       description: "Designed for scaling stores.",
//       buttonLabel: "Choose Growth",
//       features: [
//         "Unlimited AI requests",
//         "Premium analytics",
//         "Advanced widget controls",
//         "Priority support",
//       ],
//     },
//     {
//       name: "Enterprise",
//       price: isYearly ? "$71.28/mo" : "$89.1/mo",
//       description: "For high-volume stores.",
//       buttonLabel: "Choose Enterprise",
//       features: [
//         "Unlimited features",
//         "Dedicated success manager",
//         "Custom integrations",
//         "Highest priority support",
//       ],
//     },
//   ];

//   return (
//     <Page title="Pricing Plans">
      
//       {/* Billing Toggle */}
//       <Card sectioned>
//         <Box
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             gap: "1rem",
//           }}
//         >
//           <Button
//             pressed={billingCycle === "monthly"}
//             onClick={() => setBillingCycle("monthly")}
//           >
//             Pay monthly
//           </Button>

//           <Button
//             pressed={billingCycle === "yearly"}
//             onClick={() => setBillingCycle("yearly")}
//           >
//             Pay yearly (Save 20%)
//           </Button>
//         </Box>
//       </Card>

//       <Box style={{ paddingBlock: "1rem" }}>
//         <Divider />
//       </Box>

//       {/* Pricing Cards Grid */}
//       <Box
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
//           gap: "20px",
//         }}
//       >
//         {plans.map((plan, index) => (
//           <Card
//             key={index}
//             sectioned
//             background={plan.highlighted ? "bg-surface-success" : undefined}
//           >
//             <Box
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 marginBottom: "0.5rem",
//               }}
//             >
//               <Text variant="headingLg">{plan.name}</Text>

//               {plan.badge && (
//                 <Badge tone="success">{plan.badge}</Badge>
//               )}
//             </Box>

//             <Text tone="subdued">{plan.description}</Text>

//             <Text variant="heading2xl" as="h2" tone="base">
//               {plan.price}
//             </Text>

//             {/* Features */}
//             <Box style={{ paddingBlock: "1rem" }}>
//               {plan.features.map((feature, i) => (
//                 <Box
//                   key={i}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                     marginBottom: "0.4rem",
//                   }}
//                 >
//                   <span>✔</span>
//                   <Text>{feature}</Text>
//                 </Box>
//               ))}
//             </Box>

//             <Divider />

//             <Box style={{ paddingTop: "1rem" }}>
//               <Button fullWidth variant="primary">
//                 {plan.buttonLabel}
//               </Button>
//             </Box>
//           </Card>
//         ))}
//       </Box>
//     </Page>
//   );
// }

import {
  Page,
  Card,
  Text,
  Button,
  Badge,
  Divider,
  Box,
  ButtonGroup,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const isYearly = billingCycle === "yearly";

  const [widgetType, setWidgetType] = useState("skin");

  // Load widget type from previous widget selection
  useEffect(() => {
    const saved = localStorage.getItem("selectedWidgetType");
    if (saved) setWidgetType(saved);
  }, []);

  // Pricing Plans Based on Widget Type
  const pricingPlans = {
    skin: [
      {
        name: "Free",
        price: "$0/mo",
        description: "Perfect for starting with Skin Analysis.",
        buttonLabel: "Current Plan",
        features: ["Skin widget", "100 scans/mo", "Basic customization", "Email support"],
      },
      {
        name: "Starter",
        price: isYearly ? "$9/mo" : "$12/mo",
        badge: "Most Popular",
        description: "Ideal for growing businesses.",
        buttonLabel: "Choose Starter",
        highlighted: true,
        features: [
          "Full Skin AI widget",
          "1,000 scans/mo",
          "Advanced customization",
          "Remove branding",
          "Live chat support",
        ],
      },
      {
        name: "Growth",
        price: isYearly ? "$22/mo" : "$29/mo",
        description: "Designed for scaling stores.",
        buttonLabel: "Choose Growth",
        features: [
          "Unlimited scans",
          "Premium analytics",
          "Priority support",
          "Advanced widget control",
        ],
      },
    ],

    hair: [
      {
        name: "Free",
        price: "$0/mo",
        description: "Start your Hair Analysis journey.",
        buttonLabel: "Current Plan",
        features: ["Hair widget", "100 scans/mo", "Basic customization", "Email support"],
      },
      {
        name: "Starter",
        price: isYearly ? "$11/mo" : "$15/mo",
        badge: "Most Popular",
        description: "Grow with advanced hair insights.",
        buttonLabel: "Choose Starter",
        highlighted: true,
        features: [
          "Full Hair AI widget",
          "1,500 scans/mo",
          "Advanced analytics",
          "Remove branding",
          "Live chat support",
        ],
      },
      {
        name: "Growth",
        price: isYearly ? "$27/mo" : "$35/mo",
        description: "For high-performance stores.",
        buttonLabel: "Choose Growth",
        features: [
          "Unlimited scans",
          "Premium analytics",
          "Widget A/B testing",
          "Priority support",
        ],
      },
    ],

    both: [
      {
        name: "Free",
        price: "$0/mo",
        description: "Try combined Skin + Hair AI.",
        buttonLabel: "Current Plan",
        features: ["Both widgets", "100 combined scans/mo", "Basic customization", "Email support"],
      },
      {
        name: "Starter",
        price: isYearly ? "$19/mo" : "$24/mo",
        badge: "Most Popular",
        description: "Unlock both AI models together.",
        buttonLabel: "Choose Starter",
        highlighted: true,
        features: [
          "Skin + Hair AI widgets",
          "3,000 scans/mo",
          "Advanced customization",
          "Remove branding",
          "Live chat support",
        ],
      },
      {
        name: "Growth",
        price: isYearly ? "$39/mo" : "$49/mo",
        description: "Ultimate combination power.",
        buttonLabel: "Choose Growth",
        features: [
          "Unlimited scans",
          "Premium reporting",
          "Team collaboration",
          "Priority support",
        ],
      },
    ],
  };

  const plans = pricingPlans[widgetType];

  return (
    <Page title="Pricing Plans">

      {/* Widget Type Switch */}
      <Card sectioned>
        <ButtonGroup>
          <Button pressed={widgetType === "skin"} onClick={() => setWidgetType("skin")}>
            Skin Analyze
          </Button>
          <Button pressed={widgetType === "hair"} onClick={() => setWidgetType("hair")}>
            Hair Analyze
          </Button>
          <Button pressed={widgetType === "both"} onClick={() => setWidgetType("both")}>
            Skin + Hair
          </Button>
        </ButtonGroup>
      </Card>

      <Box style={{ paddingBlock: "1rem" }}>
        <Divider />
      </Box>

      {/* Billing Cycle */}
      <Card sectioned>
        <Box style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Button
            pressed={billingCycle === "monthly"}
            onClick={() => setBillingCycle("monthly")}
          >
            Pay monthly
          </Button>

          <Button
            pressed={billingCycle === "yearly"}
            onClick={() => setBillingCycle("yearly")}
          >
            Pay yearly (Save 20%)
          </Button>
        </Box>
      </Card>

      <Box style={{ paddingBlock: "1rem" }}>
        <Divider />
      </Box>

      {/* Pricing Cards */}
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {plans.map((plan, index) => (
          <Card
            key={index}
            sectioned
            background={plan.highlighted ? "bg-surface-success" : undefined}
          >
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <Text variant="headingLg">{plan.name}</Text>

              {plan.badge && <Badge tone="success">{plan.badge}</Badge>}
            </Box>

            <Text tone="subdued">{plan.description}</Text>

            <Text variant="heading2xl" as="h2">
              {plan.price}
            </Text>

            {/* Features */}
            <Box style={{ paddingBlock: "1rem" }}>
              {plan.features.map((feature, i) => (
                <Box
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  ✔ <Text>{feature}</Text>
                </Box>
              ))}
            </Box>

            <Divider />

            <Box style={{ paddingTop: "1rem" }}>
              <Button fullWidth>{plan.buttonLabel}</Button>
            </Box>
          </Card>
        ))}
      </Box>
    </Page>
  );
}



