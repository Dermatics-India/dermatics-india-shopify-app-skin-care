import { useEffect, useRef } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { ProgressBar } from "../components/common";

import { loadShopRecord } from "~/lib/shopAuth.server";
import { getPlans, createPlanSubscription } from "~/lib/billing.server";

// Top-frame navigation — required for Shopify billing confirmation pages,
// which refuse to load inside the embedded app iframe.
function redirectTopFrame(url) {
  if (typeof window === "undefined") return;
  if (window.top && window.top !== window.self) {
    window.top.location.href = url;
  } else {
    window.location.href = url;
  }
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopRecord = await loadShopRecord(session);
  const payload = await getPlans({ shopRecord });
  return Response.json(payload);
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopRecord = await loadShopRecord(session);
  const formData = await request.formData();
  const planId = formData.get("planId");

  const result = await createPlanSubscription({ admin, shopRecord, planId });
  return Response.json(result.body, { status: result.status });
};

export default function Plans() {
  const { t } = useTranslation();
  const { plans = [], currentPlan, trial, usage } = useLoaderData();
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state !== "idle";
  const pendingPlanId = isSubmitting ? fetcher.formData?.get("planId") : null;

  // Each fetcher result must only be processed once. Without this guard, any
  // re-render after the response arrives would re-fire the toast/redirect.
  const handledResultRef = useRef(null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (handledResultRef.current === fetcher.data) return;
    handledResultRef.current = fetcher.data;

    const res = fetcher.data;

    if (!res.success) {
      shopify.toast.show(res.message || t("plans.upgradeFailed"), { isError: true });
      return;
    }
    if (res.url) {
      // Paid plan: top-frame redirect to Shopify's billing confirmation page.
      // After approval, Shopify will hit /api/billing/confirm and bring the
      // merchant back into the embedded app.
      redirectTopFrame(res.url);
      return;
    }
    if (res.downgraded) {
      shopify.toast.show(res.message || t("plans.planUpdated"));
    }
  }, [fetcher.state, fetcher.data, t]);

  const handleUpgrade = (planId) => {
    fetcher.submit({ planId: String(planId) }, { method: "post" });
  };

  const usageProgress =
    usage && !usage.unlimited && usage.limit > 0
      ? Math.min(100, Math.round((usage.count / usage.limit) * 100))
      : 0;

  return (
    <s-page heading={t("plans.title")}>
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
                  <ProgressBar progress={usageProgress} size="small" />
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
                  disabled={plan.current || isSubmitting || undefined}
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
