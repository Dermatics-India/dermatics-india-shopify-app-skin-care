// ── ZeptoMail (active) ────────────────────────────────────────────────────────
import { SendMailClient } from "zeptomail";
import { APP_NAME, APP_STORE_URL } from "../constant/app.js";

let _zepto = null;
function getZeptoClient() {
  if (_zepto) return _zepto;
  _zepto = new SendMailClient({
    url: process.env.ZEPTOMAIL_URL,
    token: process.env.ZEPTOMAIL_TOKEN,
  });
  return _zepto;
}

function isZeptoConfigured() {
  return !!(process.env.ZEPTOMAIL_TOKEN && process.env.ZEPTOMAIL_FROM_EMAIL);
}

// ── Nodemailer / Gmail SMTP (kept for reference, not active) ──────────────────
// import nodemailer from "nodemailer";
//
// let _transporter = null;
// function getTransporter() {
//   if (_transporter) return _transporter;
//   _transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: process.env.SMTP_SECURE === "true",
//     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
//   });
//   return _transporter;
// }
//
// async function sendViaSmtp({ to, subject, html }) {
//   await getTransporter().sendMail({
//     from: process.env.SMTP_FROM || `"Dermatics AI" <noreply@dermatics.in>`,
//     to, subject, html,
//   });
// }

// ─────────────────────────────────────────────────────────────────────────────
// buildMergeInfo
// Constructs the standard merge_info object shared across all ZeptoMail
// templates. Override only the fields that differ per email type.
// ─────────────────────────────────────────────────────────────────────────────
export function buildMergeInfo({ shop, planName = "", trialEndsAt = null, link = null } = {}) {
  return {
    app_name: APP_NAME,
    store_name: shop || "",
    plan_name: planName,
    trial_date: trialEndsAt
      ? trialEndsAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "",
    trial_end_link: link || (shop ? `https://${shop}/admin/apps` : APP_STORE_URL),
    team: `${APP_NAME} Team`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// sendTemplateMail
// Sends a ZeptoMail template-based email.
// templateKey → env var value from ZEPTOMAIL_TEMPLATE_* vars
// mergeInfo   → use buildMergeInfo() to construct
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTemplateMail({ to, toName, templateKey, mergeInfo = {} }) {
  if (!isZeptoConfigured()) {
    console.warn(`[mailer] ZeptoMail not configured — skipping template "${templateKey}" to ${to}`);
    return;
  }
  if (!to || !templateKey) {
    console.warn(`[mailer] Missing recipient or templateKey — skipping`);
    return;
  }
  try {
    await getZeptoClient().sendMailWithTemplate({
      template_key: templateKey,
      from: {
        address: process.env.ZEPTOMAIL_FROM_EMAIL,
        name: APP_NAME,
      },
      to: [{ email_address: { address: to, name: toName || "" } }],
      merge_info: mergeInfo,
    });
    console.log(`[mailer] Sent template "${templateKey}" → ${to}`);
  } catch (err) {
    console.error(`[mailer] Failed to send template "${templateKey}":`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// sendMail
// Sends a raw HTML email via ZeptoMail (kept for custom/one-off use).
// ─────────────────────────────────────────────────────────────────────────────
export async function sendMail({ to, subject, html }) {
  if (!isZeptoConfigured()) {
    console.warn(`[mailer] ZeptoMail not configured — skipping "${subject}" to ${to}`);
    return;
  }
  if (!to) {
    console.warn(`[mailer] No recipient for "${subject}" — skipping`);
    return;
  }
  try {
    await getZeptoClient().sendMail({
      from: {
        address: process.env.ZEPTOMAIL_FROM_EMAIL,
        name: APP_NAME,
      },
      to: [{ email_address: { address: to } }],
      subject,
      htmlbody: html,
    });
    console.log(`[mailer] Sent "${subject}" → ${to}`);
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}":`, err.message);
  }
}
