# Derma AI Widget — Flow & API Reference

## Overview

The Derma AI widget is a Shopify storefront extension that walks customers through an AI-powered skin or hair assessment. It is built as a floating chat-style drawer (or an inline full-page embed) and is entirely self-contained in `assets/derma-ai.js`.

---

## Architecture

```
ApiHandler          — low-level fetch wrapper (GET / POST / multipart)
DermaApiService     — typed API methods for every endpoint
DermaAIWizard       — the wizard: state, UI rendering, and orchestration
```

---

## Wizard State

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string \| null` | External session ID returned by the AI backend |
| `currentStep` | `string \| null` | Active `step_id` from the last UI response |
| `activeFlow` | `"skinCare" \| "hairCare"` | Which flow the customer is in |
| `isSubmitting` | `boolean` | Prevents double-submits |
| `timeline` | `array` | Chat message history rendered to the screen |
| `customerId` | `string \| null` | Internal DB customer ID (set after upsert) |
| `aiSessionId` | `string \| null` | Internal DB AI session ID (set after `session_start` event) |
| `analysisCompleted` | `boolean` | Guards `analysis_complete` from firing twice |
| `chatStarted` | `boolean` | Guards `ai_chat_start` from firing more than once per session |

---

## Full Session Flow

```
Customer clicks launcher button
        │
        ▼
startSession()
  ├─ Guard: customer must be logged in → redirect to /account/login
  ├─ setActiveFlow() → determines skinCare or hairCare based on enabled modules
  ├─ GET /apps/derma-advisor/scan-check  ← daily limit check
  │     └─ blocked? → show limit message and stop
  ├─ POST {baseUrl}/api/session/start    ← start AI session
  └─ _recordCustomerAndSession() [async, fire-and-forget]
        ├─ POST /apps/derma-advisor/customer  ← upsert customer
        └─ POST /apps/derma-advisor/analysis/event  (type: session_start)
                └─ stores aiSessionId in state

Customer answers questionnaire steps
  └─ submitStep() on each answer
        └─ POST {baseUrl}/api/flow/submit
              └─ if response step_id === "product_recommendation_start"
                    └─ POST /apps/derma-advisor/analysis/event  (type: product_recommendation)

Customer uploads skin/hair photo
  └─ renderImageUpload()
        ├─ POST {baseUrl}/api/flow/upload-image  (multipart)
        └─ POST /apps/derma-advisor/analysis/event  (type: image_upload)
              └─ strict quota check — blocks if daily or plan limit reached

AI analysis results shown  →  product routine shown

AI Report card shown
  └─ renderAIReport()
        ├─ POST /apps/derma-advisor/analysis/event  (type: analysis_complete)
        └─ Download button clicked
              └─ POST /apps/derma-advisor/analysis/event  (type: doctor_report_download)

Customer clicks "AI Assistant"
  └─ enterAssistantMode() → opens chat composer
        └─ First message sent → sendAssistantMessage()
              └─ POST /apps/derma-advisor/analysis/event  (type: ai_chat_start)  ← fires once

Customer clicks "Start Over"
  └─ startSession()  ← full restart, state reset
```

---

## UI Step Types

| `ui_type` | Renderer | Description |
|---|---|---|
| `card_select` | `renderCardSelect` | Single-select image cards (e.g. choose concern) |
| `pill_list` | `renderPillList` | Pill-style single-select |
| `button_list` | `renderButtonList` | Vertical button list |
| `multi_select` | `renderMultiSelect` | Multiple-choice selection |
| `image_upload` | `renderImageUpload` | Camera / file upload step |
| `analysis_cards` | `renderAnalysisCards` | Grouped AI condition results with confidence % |
| `product_routine` | `renderRoutine` | Skincare AM/PM product routine grid |
| `hair_product_routine` | `renderRoutine` | Hair product routine grid |
| `ai_report` | `renderAIReport` | Final report card with PDF download button |
| `final_actions` | `renderFinalActions` | Post-report action buttons |
| `action_button` | `renderActionButton` | Single CTA button |

---

## API Endpoints

### Shopify App Proxy (storefront-facing)

All proxy endpoints are prefixed with `/apps/derma-advisor`.

---

#### `GET /apps/derma-advisor/widget-settings`

Fetches widget, drawer, module, and permission settings for the shop.

**Query params:** none

**Response:**
```json
{
  "widget": { "position": "bottom-right", "buttonText": "Analyze Skin", "bgColor": "#0084ff", ... },
  "drawer":  { "bgColor": "#fff", "header": { "label": "...", "bgColor": "..." }, "bubble": { ... } },
  "modules": {
    "skinCare": { "enabled": true, "text": { "label": "Skin Analysis" }, "image": { "url": "..." } },
    "hairCare": { "enabled": true, "text": { "label": "Hair Analysis" }, "image": { "url": "..." } }
  },
  "permissions": { "skinEnabled": true, "hairEnabled": true }
}
```

---

#### `GET /apps/derma-advisor/scan-check`

Checks whether the customer has daily scans remaining before starting a session.

**Query params:**

| Key | Type | Required | Description |
|---|---|---|---|
| `shopifyCustomerId` | `string` | Yes | Shopify customer GID (e.g. `gid://shopify/Customer/123`) |

**Response:**
```json
{
  "allowed": true,
  "scansUsed": 1,
  "scansLimit": 2,
  "nextAvailableAt": null
}
```

---

#### `POST /apps/derma-advisor/customer`

Creates or updates the customer record in the app database.

**Payload:**

| Key | Type | Required | Description |
|---|---|---|---|
| `shopifyCustomerId` | `string` | Yes | Shopify customer GID |
| `email` | `string` | No | Customer email |
| `firstName` | `string` | No | First name |
| `lastName` | `string` | No | Last name |

**Response:**
```json
{ "success": true, "data": { "customerId": "<internal-db-id>" } }
```

---

#### `POST /apps/derma-advisor/analysis/event`

Single unified endpoint for all customer activity events. The `type` field determines the action.

**Common payload fields:**

| Key | Type | Required by | Description |
|---|---|---|---|
| `type` | `string` | all | Event type (see below) |
| `customerId` | `string` | `session_start` | Internal DB customer ID |
| `sessionId` | `string` | most types | Internal DB AI session ID (`aiSessionId`) |
| `externalSessionId` | `string` | most types | External session ID from AI backend (`sessionId`) |
| `flowType` | `string` | `session_start` | `"skin_flow"` or `"hair_flow"` |

**Event types and their required payload keys:**

| `type` | Required keys | Side effects |
|---|---|---|
| `session_start` | `customerId`, `externalSessionId`, `flowType` | Creates `AiSession` (status: started), returns `sessionId` |
| `image_upload` | `sessionId` or `externalSessionId` | Increments `totalScans` (+0.5), updates `dailyScanCount`, enforces quota (strict — returns 429 if denied) |
| `product_recommendation` | `sessionId` or `externalSessionId` | Increments `totalScans` (+0.5), updates `dailyScanCount` (best-effort, never blocks) |
| `analysis_complete` | `sessionId` or `externalSessionId` | Marks `AiSession` as completed |
| `doctor_report_download` | `sessionId` or `customerId` | Logs event only |
| `ai_chat_start` | `sessionId` or `customerId` | Logs event only |

**Success response:**
```json
{ "success": true, "data": { "sessionId": "<ai-session-id>", "eventId": "..." } }
```

**Quota denial response (429, `image_upload` only):**
```json
{
  "success": false,
  "code": "USAGE_LIMIT_REACHED",
  "message": "...",
  "usage": { ... }
}
```

---

### AI Backend (external `baseUrl`)

These endpoints talk to the AI processing service, not the Shopify app proxy.

---

#### `POST {baseUrl}/api/session/start`

Starts a new AI flow session.

**Payload:**

| Key | Type | Required | Description |
|---|---|---|---|
| `platform` | `string` | Yes | Always `"web"` |
| `flowType` | `string` | Yes | `"skin_flow"` or `"hair_flow"` |

**Response:**
```json
{
  "session_id": "abc123",
  "ui": { "ui_type": "card_select", "heading": "...", "intro_message": "...", "options": [...] }
}
```

---

#### `POST {baseUrl}/api/flow/submit`

Submits the customer's answer to the current step and receives the next UI.

**Payload:**

| Key | Type | Required | Description |
|---|---|---|---|
| `session_id` | `string` | Yes | External session ID |
| `step_id` | `string` | Yes | ID of the step being answered |
| `response` | `any` | Yes | Customer's answer value |
| `flowType` | `string` | Yes | `"skin_flow"` or `"hair_flow"` |

**Response:**
```json
{
  "step_id": "product_recommendation_start",
  "ui": { "ui_type": "product_routine", "heading": "...", "routine": [...] }
}
```

---

#### `POST {baseUrl}/api/flow/upload-image`

Uploads the customer's skin or hair photo for AI analysis. Sent as `multipart/form-data`.

**Form fields:**

| Key | Type | Required | Description |
|---|---|---|---|
| `image` | `File` | Yes | The photo file |
| `analysis_type` | `string` | Yes | `"skinCare"` or `"hairCare"` |

**Response:**
```json
{
  "ui": { "ui_type": "analysis_cards", "results": [...] }
}
```

---

## Shopify Cart Attribution

When a customer adds a product to cart, three note attributes are stamped on the cart to link the purchase back to the AI session:

| Attribute | Value |
|---|---|
| `ai_dermatics_session` | External session ID (`state.sessionId`) |
| `ai_dermatics_customer` | Internal DB customer ID (`state.customerId`) |
| `ai_dermatics_ai_session` | Internal DB AI session ID (`state.aiSessionId`) |

---

## Daily Scan Limits

- **Limit:** 2 full scans per 24-hour rolling window
- **Cost:** each scan = 1.0 unit (0.5 at image upload + 0.5 at product recommendation)
- **Enforced at:** session start (`scan-check`) and image upload (`analysis/event` type `image_upload`)
- **Reset:** automatic — 24 hours after the first scan of the current window
- When blocked, the UI displays the exact reset date/time in the customer's local timezone
