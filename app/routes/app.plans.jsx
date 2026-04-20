import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { useApi } from "../hooks/useApi";
import { ENDPOINTS } from "../utils/endpoints";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

function PlanSkeletonGrid() {
  return (
    <s-grid gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="base">
      {[1, 2, 3, 4].map((i) => (
        <s-section key={i}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                style={{
                  height: "12px",
                  width: `${60 + ((j * 7) % 35)}%`,
                  borderRadius: "4px",
                  background:
                    "linear-gradient(90deg, #eceff1 0%, #f5f7f8 50%, #eceff1 100%)",
                  backgroundSize: "200% 100%",
                  animation: "skeencare-shimmer 1.4s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        </s-section>
      ))}
      <style>{`@keyframes skeencare-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </s-grid>
  );
}

export default function Plans() {
  const { t } = useTranslation();
  const api = useApi();

  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [trial, setTrial] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPlanId, setPendingPlanId] = useState(null);

  const loadPlans = () => {
    setIsLoading(true);
    api
      .get(ENDPOINTS.GET_PLANS)
      .then((res) => {
        if (res.success) {
          setPlans(res.plans);
          setCurrentPlan(res.currentPlan);
          setTrial(res.trial);
          setUsage(res.usage);
        }
      })
      .catch(() => {
        if (typeof shopify !== "undefined") {
          shopify.toast.show(t("plans.failedToLoad"), { isError: true });
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleUpgrade = async (planId) => {
    setPendingPlanId(planId);
    try {
      const res = await api.post(ENDPOINTS.SUBSCRIPTOIN, { planId });
      if (!res?.success) {
        shopify.toast.show(res?.message || t("plans.upgradeFailed"), { isError: true });
        return;
      }
      if (res.downgraded) {
        shopify.toast.show(res.message || t("plans.planUpdated"));
        loadPlans();
        return;
      }
      if (res.url) {
        if (window.top) window.top.location.href = res.url;
        else window.location.href = res.url;
      }
    } catch (err) {
      const message = err?.message || err?.errors?.[0]?.message || t("plans.upgradeFailed");
      shopify.toast.show(message, { isError: true });
    } finally {
      setPendingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <s-page heading={t("plans.loadingTitle")}>
        <PlanSkeletonGrid />
      </s-page>
    );
  }

  const usageProgress =
    usage && !usage.unlimited && usage.limit > 0
      ? Math.min(100, Math.round((usage.count / usage.limit) * 100))
      : 0;

  return (
    <s-page>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <s-heading size="large">{t("plans.title")}</s-heading>
          <s-paragraph>{t("plans.description")}</s-paragraph>
        </div>

        {trial?.inTrial && (
          <s-banner
            tone="info"
            heading={t("plans.trialBanner.title", { days: trial.daysRemaining, count: trial.daysRemaining })}
          >
            <s-paragraph>
              {t("plans.trialBanner.description", { date: new Date(trial.endsAt).toLocaleDateString() })}
            </s-paragraph>
          </s-banner>
        )}

        {currentPlan && usage && (
          <s-section>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <s-heading>{t("plans.currentPlanLabel", { name: currentPlan.name })}</s-heading>
                {currentPlan.isUnlimited ? (
                  <s-badge tone="success">{t("plans.unlimited")}</s-badge>
                ) : (
                  <s-badge>
                    {t("plans.scansUsed", { count: usage.count, limit: usage.limit })}
                  </s-badge>
                )}
              </div>
              {!currentPlan.isUnlimited && (
                <>
                  <s-progress-indicator progress={usageProgress} size="small" />
                  <s-text tone="subdued">
                    {t("plans.resets", { date: new Date(usage.periodEndsAt).toLocaleDateString() })}
                  </s-text>
                </>
              )}
            </div>
          </s-section>
        )}

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {plans.map((plan) => (
            <s-section key={plan.id}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <s-heading size="large">{plan.name}</s-heading>
                  {plan.current && <s-badge tone="success">{t("plans.current")}</s-badge>}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700 }}>${plan.price}</span>
                  <s-text tone="subdued">{t("plans.perMonth")}</s-text>
                </div>

                {plan.trialDays > 0 && !trial?.used && !plan.current && (
                  <div>
                    <s-badge tone="attention">
                      {t("plans.freeTrialBadge", { days: plan.trialDays })}
                    </s-badge>
                  </div>
                )}

                <ul style={{ margin: 0, paddingInlineStart: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <s-text>{feature}</s-text>
                    </li>
                  ))}
                </ul>

                <s-button
                  variant="primary"
                  disabled={plan.current || pendingPlanId !== null || undefined}
                  loading={pendingPlanId === plan.id ? "" : undefined}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.current ? t("plans.currentPlan") : t("plans.upgrade")}
                </s-button>
              </div>
            </s-section>
          ))}
        </s-grid>
      </div>
    </s-page>
  );
}
