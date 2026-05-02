import { APP_NAME as BRAND_NAME, BRAND_COLOR, APP_STORE_URL as SHOPIFY_APP_STORE_URL, SUPPORT_EMAIL } from "../constant/app.js";

function baseLayout({ previewText, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background-color:#0f172a;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${BRAND_NAME}</span>
            <span style="display:inline-block;background:${BRAND_COLOR};color:#fff;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:3px 8px;border-radius:4px;margin-left:8px;vertical-align:middle;">AI</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} ${BRAND_NAME} · AI-Powered Skin & Hair Analysis
            </p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;">${SUPPORT_EMAIL}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text, url) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
    <tr>
      <td style="background-color:${BRAND_COLOR};border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">${text}</h1>`;
}

function p(text) {
  return `<p style="margin:0 0 14px;font-size:15px;color:#475569;line-height:1.6;">${text}</p>`;
}

function featureList(items) {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#334155;">
          <span style="color:${BRAND_COLOR};font-weight:700;margin-right:8px;">✓</span>${item}
        </td></tr>`,
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">${rows}</table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

export function welcomeEmail({ ownerName, shop }) {
  const displayName = ownerName || "there";
  const appUrl = `https://${shop}/admin/apps`;
  return {
    subject: `Welcome to ${BRAND_NAME}! Your AI skin & hair widget is ready 🎉`,
    html: baseLayout({
      previewText: `Hey ${displayName}, your Dermatics AI widget is ready to go live.`,
      body: `
        ${h1(`Welcome to ${BRAND_NAME}, ${displayName}!`)}
        ${p(`We're thrilled to have <strong>${shop}</strong> on board. Your AI-powered skin &amp; hair analysis widget is installed and ready to configure.`)}
        ${divider()}
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Get started in 3 steps</p>
        ${featureList([
        "Enable the App Embed in your Shopify theme editor",
        "Customize your widget colors, position, and messaging",
        "Choose a plan that fits your store's volume",
      ])}
        ${p("Once live, your customers can run a personalized skin or hair analysis directly from your storefront — and you'll see every session, order, and insight inside your dashboard.")}
        ${ctaButton("Open Dermatics AI", appUrl)}
      `,
    }),
  };
}

export function goodbyeEmail({ ownerName, shop }) {
  const displayName = ownerName || "there";
  return {
    subject: `We're sad to see you go, ${displayName}`,
    html: baseLayout({
      previewText: `Your Dermatics AI app has been uninstalled from ${shop}.`,
      body: `
        ${h1("You've uninstalled Dermatics AI")}
        ${p(`Hi ${displayName}, we noticed that <strong>${shop}</strong> has uninstalled ${BRAND_NAME}. We're sorry to see you go.`)}
        ${divider()}
        ${p("If there was something we could have done better, we'd love to hear your feedback. Your input directly shapes how we improve the app.")}
        ${p(`Reply to this email or reach us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a> — we read every message.`)}
        ${divider()}
        ${p("Changed your mind? You can reinstall anytime and pick up right where you left off.")}
        ${ctaButton("Reinstall Dermatics AI", SHOPIFY_APP_STORE_URL)}
      `,
    }),
  };
}

export function planUpgradeEmail({ ownerName, shop, planName, interval }) {
  const displayName = ownerName || "there";
  const cadence = interval === "year" ? "Yearly" : "Monthly";
  const appUrl = `https://${shop}/admin/apps`;
  return {
    subject: `You're now on the ${planName} plan — welcome to more scans!`,
    html: baseLayout({
      previewText: `Your ${planName} (${cadence}) plan is now active on ${shop}.`,
      body: `
        ${h1(`You're on the ${planName} plan 🚀`)}
        ${p(`Hi ${displayName}, your <strong>${planName} (${cadence})</strong> subscription for <strong>${shop}</strong> is now active. Here's what you've unlocked:`)}
        ${featureList([
        "Increased monthly scan quota",
        "Full skin &amp; hair analysis flows",
        "Priority customer support",
        "Advanced analytics dashboard",
      ])}
        ${divider()}
        ${p("Your widget is already live with your new limits. Head to your dashboard to see real-time usage and insights.")}
        ${ctaButton("View Your Dashboard", appUrl)}
      `,
    }),
  };
}

export function planExpiredEmail({ ownerName, shop, reason }) {
  const displayName = ownerName || "there";
  const appUrl = `https://${shop}/admin/apps`;
  const reasonMap = {
    CANCELLED: "has been cancelled",
    EXPIRED: "has expired",
    DECLINED: "was declined",
    FROZEN: "has been frozen",
  };
  const reasonText = reasonMap[reason] || "has ended";
  return {
    subject: `Action needed: Your ${BRAND_NAME} subscription ${reasonText}`,
    html: baseLayout({
      previewText: `Your paid subscription on ${shop} ${reasonText}. Your widget has reverted to the Free plan.`,
      body: `
        ${h1(`Your subscription ${reasonText}`)}
        ${p(`Hi ${displayName}, your paid ${BRAND_NAME} subscription on <strong>${shop}</strong> ${reasonText}.`)}
        ${divider()}
        <table cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px;width:100%;">
          <tr><td style="font-size:14px;color:#dc2626;font-weight:500;">
            ⚠️ Your storefront widget has been reverted to the <strong>Free plan</strong>. Scan limits apply immediately.
          </td></tr>
        </table>
        ${p("To restore full access and continue offering AI skin & hair analysis to your customers, choose a plan below.")}
        ${ctaButton("Upgrade Now", appUrl)}
        ${divider()}
        ${p(`If you believe this is an error or need help, contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a>.`)}
      `,
    }),
  };
}

export function usageLimitEmail({ ownerName, shop, planName, usageLimit }) {
  const displayName = ownerName || "there";
  const appUrl = `https://${shop}/admin/apps`;
  return {
    subject: `You've reached your ${planName} scan limit on ${shop}`,
    html: baseLayout({
      previewText: `Your ${usageLimit}-scan monthly limit is reached. Upgrade to keep your widget running.`,
      body: `
        ${h1("You've hit your monthly scan limit")}
        ${p(`Hi ${displayName}, your store <strong>${shop}</strong> has used all <strong>${usageLimit} scans</strong> included in your <strong>${planName}</strong> plan this month.`)}
        ${divider()}
        <table cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px;width:100%;">
          <tr><td style="font-size:14px;color:#c2410c;font-weight:500;">
            ⚡ New scan requests from your customers are currently paused until you upgrade or your usage period resets.
          </td></tr>
        </table>
        ${p("Upgrade to a higher plan to instantly restore unlimited (or higher limit) scans and keep the AI analysis running for your customers.")}
        ${ctaButton("Upgrade My Plan", appUrl)}
        ${divider()}
        ${p("Your scan count resets automatically at the start of your next billing period. If you have questions, we're here at <a href=\"mailto:" + SUPPORT_EMAIL + "\" style=\"color:" + BRAND_COLOR + ";\">" + SUPPORT_EMAIL + "</a>.")}
      `,
    }),
  };
}
