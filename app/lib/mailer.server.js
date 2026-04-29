// ── ZeptoMail (active) ────────────────────────────────────────────────────────
import { SendMailClient } from "zeptomail";

let _zepto = null;
function getZeptoClient() {
  if (_zepto) return _zepto;
  _zepto = new SendMailClient({
    url: process.env.ZEPTOMAIL_URL,
    token: process.env.ZEPTOMAIL_TOKEN,
  });
  return _zepto;
}

async function sendViaZeptoMail({ to, subject, html }) {
  await getZeptoClient().sendMail({
    from: {
      address: process.env.ZEPTOMAIL_FROM_EMAIL,
      name: process.env.ZEPTOMAIL_FROM_NAME || "Dermatics AI",
    },
    to: [{ email_address: { address: to } }],
    subject,
    htmlbody: html,
  });
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
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
//   return _transporter;
// }
//
// async function sendViaSmtp({ to, subject, html }) {
//   await getTransporter().sendMail({
//     from: process.env.SMTP_FROM || `"Dermatics AI" <noreply@dermatics.in>`,
//     to,
//     subject,
//     html,
//   });
// }

// ── Unified sendMail — uses ZeptoMail when configured, SMTP otherwise ─────────
/**
 * Send a transactional email.
 * Silently no-ops when no mail provider is configured (local dev).
 */
export async function sendMail({ to, subject, html }) {
  if (!to) {
    console.warn(`[mailer] No recipient for "${subject}" — skipping`);
    return;
  }

  const useZepto = process.env.ZEPTOMAIL_TOKEN && process.env.ZEPTOMAIL_FROM_EMAIL;
  // const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER;

  if (!useZepto /* && !useSmtp */) {
    console.warn(`[mailer] No mail provider configured — skipping "${subject}" to ${to}`);
    return;
  }

  try {
    if (useZepto) {
      await sendViaZeptoMail({ to, subject, html });
    }
    // else if (useSmtp) {
    //   await sendViaSmtp({ to, subject, html });
    // }
    console.log(`[mailer] Sent "${subject}" → ${to}`);
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}":`, err.message);
  }
}
