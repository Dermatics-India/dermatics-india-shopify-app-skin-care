import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { ProgressBar } from "../components/common";
import { BILLING_INTERVALS, PLAN_IDS } from "../constant/index.js";

import { loadShopRecord } from "~/lib/shopAuth.server";
import { getPlans, createPlanSubscription } from "~/lib/billing.server";

// utils
import { redirectTopFrame } from "~/utils";

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
  // The toggle in the UI sends "month" or "year" alongside planId.
  const interval = formData.get("interval");

  const result = await createPlanSubscription({ admin, shopRecord, planId, interval });
  return Response.json(result.body, { status: result.status });
};

export default function Plans() {
  const { t } = useTranslation();
  const { plans = [], currentPlan, subscription, trial, usage } = useLoaderData();
  const fetcher = useFetcher();

  // console.log("plans:::", plans)
  // console.log("subscription:::", subscription)
  // console.log("trial:::", trial)

  // Toggle state defaults to whatever cadence the merchant is currently on
  // (or "month" if they're on Free / never subscribed).
  const [interval, setInterval] = useState(
    subscription?.interval === BILLING_INTERVALS.YEAR
      ? BILLING_INTERVALS.YEAR
      : BILLING_INTERVALS.MONTH,
  );

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
      redirectTopFrame(res.url);
      return;
    }
    if (res.downgraded) {
      shopify.toast.show(res.message || t("plans.planUpdated"));
    }
  }, [fetcher.state, fetcher.data, t]);

  const handleUpgrade = (planId) => {
    fetcher.submit(
      { planId: String(planId), interval },
      { method: "post" },
    );
  };

  const usageProgress =
    usage && !usage.unlimited && usage.limit > 0
      ? Math.min(100, Math.round((usage.count / usage.limit) * 100))
      : 0;

  const isYearly = interval === BILLING_INTERVALS.YEAR;

  return (
    <s-page heading={t("plans.title")}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <s-heading size="large">{t("plans.title")}</s-heading>
          <s-paragraph>{t("plans.description")}</s-paragraph>
        </div>

        {/* Monthly / Yearly toggle — segmented pill switch. The sliding
            highlight is one absolutely-positioned div whose left offset
            flips on isYearly. Two button labels sit on top. */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            role="tablist"
            aria-label={t("plans.toggle.aria")}
            style={{
              position: "relative",
              display: "inline-flex",
              padding: "4px",
              background: "#f1f1f3",
              border: "1px solid #e1e1e3",
              borderRadius: "999px",
            }}
          >
            {/* Sliding highlight */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "4px",
                bottom: "4px",
                width: "calc(50% - 4px)",
                left: isYearly ? "50%" : "4px",
                background: "#ffffff",
                borderRadius: "999px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                transition: "left 180ms ease",
              }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={!isYearly}
              onClick={() => setInterval(BILLING_INTERVALS.MONTH)}
              style={{
                position: "relative",
                zIndex: 1,
                padding: "8px 20px",
                minWidth: "110px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontWeight: !isYearly ? 600 : 500,
                color: !isYearly ? "#111" : "#6b6b75",
                borderRadius: "999px",
              }}
            >
              {t("plans.toggle.monthly")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isYearly}
              onClick={() => setInterval(BILLING_INTERVALS.YEAR)}
              style={{
                position: "relative",
                zIndex: 1,
                padding: "8px 20px",
                minWidth: "110px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontWeight: isYearly ? 600 : 500,
                color: isYearly ? "#111" : "#6b6b75",
                borderRadius: "999px",
              }}
            >
              {t("plans.toggle.yearly")}
            </button>
          </div>
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
              {/* If merchant is on a paid plan, surface their billing
                  cadence so the toggle's effect is unambiguous. */}
              {currentPlan.id !== PLAN_IDS.FREE && subscription?.interval && (
                <s-text tone="subdued">
                  {t("plans.billedAs", {
                    cadence:
                      subscription.interval === BILLING_INTERVALS.YEAR
                        ? t("plans.toggle.yearly")
                        : t("plans.toggle.monthly"),
                  })}
                </s-text>
              )}
            </div>
          </s-section>
        )}

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {plans.map((plan) => {
            // Free plan ignores the toggle — it has no price/cadence.
            const isFree = plan.id === PLAN_IDS.FREE;
            const price = isFree
              ? 0
              : isYearly
                ? plan.yearlyPrice
                : plan.monthlyPrice;

            // "Current" only when planId AND interval match (or Free,
            // which has no interval). Otherwise the merchant can switch
            // cadence on a plan they're already on.
            const isExactCurrent =
              plan.current &&
              (isFree || subscription?.interval === interval);

            // Trial eligibility: plan offers a trial AND merchant hasn't
            // burned one yet AND this plan isn't one they're already on.
            // Mirrors server-side gate in createPlanSubscription so the
            // CTA never promises a trial the server will drop to 0.
            const canStartTrial =
              plan.trialDays > 0 && !trial?.used && !plan.current;

            const ctaLabel = isExactCurrent
              ? t("plans.currentPlan")
              : plan.current && !isFree
                ? t("plans.switchTo", {
                    cadence: isYearly ? t("plans.toggle.yearly") : t("plans.toggle.monthly"),
                  })
                : canStartTrial
                  ? t("plans.startTrial", { days: plan.trialDays })
                  : t("plans.upgrade");

            return (
              <s-section key={plan.id}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <s-heading size="large">{plan.name}</s-heading>
                    {isExactCurrent && <s-badge tone="success">{t("plans.current")}</s-badge>}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "28px", fontWeight: 700 }}>${price}</span>
                    <s-text tone="subdued">
                      {isYearly ? t("plans.perYear") : t("plans.perMonth")}
                    </s-text>
                  </div>

                  {canStartTrial && (
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
                    disabled={isExactCurrent || isSubmitting || undefined}
                    loading={pendingPlanId === String(plan.id) ? "" : undefined}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {ctaLabel}
                  </s-button>
                </div>
              </s-section>
            );
          })}
        </s-grid>
      </div>
    </s-page>
  );
}
