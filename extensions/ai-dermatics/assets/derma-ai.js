/**
 * Generic API Handler for JSON and Multipart requests
 */
class ApiHandler {
  constructor() { }

  handleResponse(res) {
    const isJson = res.headers.get("content-type")?.includes("application/json");

    return (isJson ? res.json().catch(() => ({})) : Promise.resolve({}))
      .then((json) => {
        if (!res.ok) {
          return {
            data: null,
            error: json.message || json.error || `Error: ${res.status}`,
            code: json.code || null,
            nextAvailableAt: json.nextAvailableAt || null,
          };
        }
        // If the API nests data inside a 'data' key, we extract it; 
        // otherwise, we return the whole object as data.
        return {
          data: json.data !== undefined ? json.data : json,
          error: null,
        };
      });
  }

  handleError(e) {
    return {
      data: null,
      error: e.message || "Network request failed.",
    };
  }



  async get(url, params = {}) {
    const query = Object.keys(params).length
      ? `?${new URLSearchParams(params)}`
      : "";

    return fetch(`${url}${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })
      .then((res) => this.handleResponse(res))
      .catch((err) => this.handleError(err));
  }

  async post(url, payload, isMultipart = false) {
    const headers = { "Accept": "application/json" };
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    const options = {
      method: "POST",
      body: isMultipart ? payload : JSON.stringify(payload),
      headers: headers
    };

    return fetch(url, options)
      .then((res) => this.handleResponse(res))
      .catch((err) => this.handleError(err));
  }
}

class DermaApiService {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.proxy = config.proxy || "/apps/derma-advisor";  // Enable it While using Proxy 
    this.endpoints = {
      sessionStart: `${this.baseUrl}/api/session/start`,
      flowSubmit: `${this.baseUrl}/api/flow/submit`,
      imageUpload: `${this.baseUrl}/api/flow/upload-image`,
      settings: `${this.proxy}/widget-settings`,
      customer: `${this.proxy}/customer`,
      analysisStart: `${this.proxy}/analysis/start`,
      analysisComplete: `${this.proxy}/analysis/complete`,
      productRecommendation: `${this.proxy}/analysis/product-recommendation`,
      imageUploaded: `${this.proxy}/analysis/image-uploaded`,
      scanCheck: `${this.proxy}/scan-check`,
    };

    // Instantiate your existing ApiHandler
    this.api = new ApiHandler();
  }

  async getSettings() {
    return this.api.get(this.endpoints.settings)
      .then((res) => { return res; })
      .catch((err) => {
        console.log("error:::", err)
        return { success: false, error: err.message };
      });
  }

  async startSession(payload) {
    return this.api.post(this.endpoints.sessionStart, payload)
      .then((res) => { return res; })
      .catch((error) => {
        return { success: false, error: err.message };
      });
  }

  async submitStep(payload) {
    return this.api.post(this.endpoints.flowSubmit, payload)
      .then((res) => { return res; })
      .catch((err) => {
        return { data: null, error: err.message };
      });
  }

  async uploadImage(formData) {
  return this.api.post(this.endpoints.imageUpload, formData, true)
    .then((res) => { return res; })
    .catch((err) => {
      return { data: null, error: err.message };
    });
}

  async upsertCustomer(payload) {
    return this.api.post(this.endpoints.customer, payload)
      .catch((err) => ({ data: null, error: err.message }));
  }

  async recordAnalysisStart(payload) {
    return this.api.post(this.endpoints.analysisStart, payload)
      .catch((err) => ({ data: null, error: err.message }));
  }

  async recordAnalysisComplete(payload) {
    return this.api.post(this.endpoints.analysisComplete, payload)
      .catch((err) => ({ data: null, error: err.message }));
  }

  async recordProductRecommendation(payload) {
    return this.api.post(this.endpoints.productRecommendation, payload)
      .catch((err) => ({ data: null, error: err.message }));
  }

  async recordImageUploaded(payload) {
    return this.api.post(this.endpoints.imageUploaded, payload)
      .catch((err) => ({ data: null, error: err.message }));
  }

  async checkScanLimit(customerId) {
    const params = customerId ? { customerId } : {};
    return this.api.get(this.endpoints.scanCheck, params)
      .catch(() => ({ data: { allowed: true }, error: null }));
  }
}

/**
 * DermaAIWizard — production-ready dermatology assessment flow.
 * UI rendering, API calls, and Shopify cart are encapsulated on the instance.
 */
class DermaAIWizard {
  constructor(config = {}) {
    console.log("Run::constructor::start")
    this.customer = config.customer;
    this.apiService = new DermaApiService(config);

    this.flowConfig = DermaAIWizard.mergeFlowConfig(
      DermaAIWizard.defaultFlowConfig(),
      config.flowConfig || {}
    );

    this.assets = config.assets

    this.state = {
      sessionId: null,
      currentStep: null,
      activeFlow: "skinCare",
      isSubmitting: false,
      timeline: [],
      customerId: null,
      aiSessionId: null,
      analysisCompleted: false,
    };

    this.uiSettings = {};

    /** Cached once at construction; full-page embeds suppress the floating launcher */
    this.isFullPage = !!document.getElementById("derma-full-page-container");

    // this.ready = this._initLauncher();
    console.log("Run::constructor::End")
  }

  static defaultFlowConfig() {
    return {
      skinCare: {
        flowType: "skin_flow",
        title: "AI Skin Advisor",
        welcome: "👋 Hello! I'm your Dermatics AI Skincare Assistant.",
      },
      hairCare: {
        flowType: "hair_flow",
        title: "AI Hair Advisor",
        welcome: "👋 Hi! I'm your Dermatics AI Hair Assistant.",
      },
    };
  }

  static mergeFlowConfig(base, override) {
    const out = { ...base };
    for (const key of Object.keys(override)) {
      out[key] = { ...(base[key] || {}), ...override[key] };
    }
    return out;
  }



  // ------ Reusable --------
  _applyDynamicStyles(el, styleObj) {
    if (!el || !styleObj) return;

    const styles = {
      backgroundColor: styleObj.bgColor || styleObj.bg,
      color: styleObj.textColor || styleObj.color,
      fontSize: styleObj.fontSize ? `${styleObj.fontSize}px` : (styleObj.size ? `${styleObj.size}px` : ""),
      fontWeight: styleObj.fontWeight || 'normal',
      borderRadius: styleObj.radius ? `${styleObj.radius}px` : '',
      padding: (styleObj.paddingY && styleObj.paddingX) ? `${styleObj.paddingY}px ${styleObj.paddingX}px` : '',
      fontFamily: styleObj.fontFamily || styleObj.font || "inherit",
      height: typeof styleObj.height === 'number' ? `${styleObj.height}px` : (styleObj.height || ""),
      width: typeof styleObj.width === 'number' ? `${styleObj.width}px` : (styleObj.width || ""),
    };

    Object.assign(el.style, styles);
  }

  // Chat-bubble styling splits into three surfaces: the card, the heading
  // row, and the text row. The card gets bgColor + radius; heading/text
  // rows each get their own font settings + four-side margin.
  _applyBubbleStyles(bubbleEl, cfg) {
    if (!bubbleEl || !cfg) return;

    if (cfg.bgColor) bubbleEl.style.backgroundColor = cfg.bgColor;
    if (cfg.radius != null) bubbleEl.style.borderRadius = `${cfg.radius}px`;

    const headingEl = bubbleEl.querySelector(".derma-ai-bubble-heading");
    if (headingEl && cfg.heading) this._applyTextStyles(headingEl, cfg.heading);

    const textEl = bubbleEl.querySelector(".derma-ai-bubble-text");
    if (textEl && cfg.text) this._applyTextStyles(textEl, cfg.text);
  }

  _applyTextStyles(el, cfg) {
    if (!el || !cfg) return;
    if (cfg.fontSize != null) el.style.fontSize = `${cfg.fontSize}px`;
    if (cfg.fontWeight) el.style.fontWeight = cfg.fontWeight;
    if (cfg.color) el.style.color = cfg.color;
    el.style.margin = `${cfg.marginTop || 0}px ${cfg.marginRight || 0}px ${cfg.marginBottom || 0}px ${cfg.marginLeft || 0}px`;
  }

  _applyPositioning(el, position = "bottom-right") {
    el.style.position = "fixed";
    const offset = "20px"; // Distance from edge

    // Reset defaults
    el.style.top = "auto";
    el.style.bottom = "auto";
    el.style.left = "auto";
    el.style.right = "auto";
    el.style.transform = "none";

    switch (position) {
      case "bottom-right":
        el.style.bottom = offset;
        el.style.right = offset;
        break;
      case "bottom-left":
        el.style.bottom = offset;
        el.style.left = offset;
        break;
      case "bottom-center":
        el.style.bottom = offset;
        el.style.left = "50%";
        el.style.transform = "translateX(-50%)";
        break;
      case "top-right":
        el.style.top = offset;
        el.style.right = offset;
        break;
      case "top-left":
        el.style.top = offset;
        el.style.left = offset;
        break;
      case "top-center":
        el.style.top = offset;
        el.style.left = "50%";
        el.style.transform = "translateX(-50%)";
        break;
      case "middle-right":
        el.style.top = "50%";
        el.style.right = "0";
        el.style.transform = "translateY(-50%)";
        break;
      case "middle-left":
        el.style.top = "50%";
        el.style.left = "0";
        el.style.transform = "translateY(-50%)";
        break;
      default:
        el.style.bottom = offset;
        el.style.right = offset;
    }
  }

  /* ---------- Full page proxy: suppress floating launcher ---------- */

  // Luncher: Anaylses Widget Button 
  createDermaLauncher(config) {
    console.log("Run::createDermaLauncher")
    const btn = document.createElement("div");
    btn.id = "derma-ai-launcher";
    btn.className = "derma-ai-launcher";

    // Handle Icon vs Text display
    btn.textContent = config.buttonText || "Analyze Skin";
    this._applyDynamicStyles(btn, config);
    this._applyPositioning(btn, config.position);
    btn.addEventListener("click", () => this.startSession());
    document.body.appendChild(btn);
    return;
  }

  async initLauncher() {
    console.log("Run::initLauncher")
    // First Called & Get settings 
    const { data, error } = await this.apiService.getSettings();
    if (error) return
    this.uiSettings = data

    if (this.isFullPage) {
      console.log("Full-page proxy detected: floating launcher suppressed.");
      return;
    }
    if (document.getElementById("derma-ai-launcher")) return;

    const config = data?.widget || {};
    this.createDermaLauncher(config)
  }

  /* ---------- DOM: drawer ---------- */

  createDrawer() {
    if (document.getElementById("derma-ai-drawer")) return;
    const config = this.uiSettings.drawer || {};
    const drawer = document.createElement("div");
    drawer.id = "derma-ai-drawer";

    // console.log("config:::", config)
    // Apply Main Drawer Background
    drawer.style.backgroundColor = config.bgColor || "#ffffff";

    const headerCfg = config?.header || {};
    const headerTitle = headerCfg?.title || headerCfg?.label || "AI Skin & Hair Care";
    const headerSubtitle = headerCfg?.subtitle || "Your personal beauty & wellness advisor";
    const headerBrand = headerCfg?.brand || "by Dermatics India";

    // Drawer header Ele
    drawer.innerHTML = `
      <div class="derma-ai-drawer-header" id="derma-drawer-header">
        <div class="derma-ai-header-text">
          <div class="derma-ai-header-title" id="derma-ai-header-title">${this.escapeHtml(headerTitle)}</div>
          ${headerSubtitle ? `<div class="derma-ai-header-subtitle">${this.escapeHtml(headerSubtitle)}</div>` : ""}
          ${headerBrand ? `<div class="derma-ai-header-brand">${this.escapeHtml(headerBrand)}</div>` : ""}
        </div>
        <span class="wizard-close" role="button" aria-label="Close">&times;</span>
      </div>
      <div id="derma-ai-screen" class="derma-ai-chat-screen"></div>
      <form id="derma-ai-composer" class="derma-ai-composer" autocomplete="off">
        <input type="text" id="derma-ai-composer-input" class="derma-ai-composer-input" placeholder="Ask About your routine...." aria-label="Ask the AI assistant" />
        <button type="submit" class="derma-ai-composer-send" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    `;
    document.body.appendChild(drawer);

    // Apply styles to the Header element
    const headerEl = drawer.querySelector("#derma-drawer-header");
    this._applyDynamicStyles(headerEl, config.header);

    drawer.querySelector(".wizard-close").addEventListener("click", () => {
      drawer.classList.remove("open");
    });

    const composer = drawer.querySelector("#derma-ai-composer");
    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = composer.querySelector("#derma-ai-composer-input");
      const text = (input.value || "").trim();
      if (!text) return;
      input.value = "";
      this.sendAssistantMessage(text);
    });
  }

  updateHeaderTitle(title) {
    const el = document.getElementById("derma-ai-header-title");
    if (el) el.textContent = title;
    const legacy = document.querySelector(".derma-ai-drawer-header span:first-child");
    if (legacy && !el) legacy.textContent = title;
  }

  /* ---------- Chat timeline ---------- */

  escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /** Safe fragment for HTML id attributes (not HTML-escaped). */
  sanitizeDomId(str) {
    return String(str ?? "").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  queryById(root, id) {
    if (typeof CSS !== "undefined" && CSS.escape) {
      return root.querySelector(`#${CSS.escape(id)}`);
    }
    return root.querySelector(`#${id}`);
  }

  _resolveAssetUrl(assetPath) {
    if (!assetPath) return "";
    if (/^https?:\/\//i.test(assetPath)) return assetPath;
    const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
    const normalizedBaseUrl = String(this.baseUrl || "").replace(/\/$/, "");
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  _isModuleEnabled(moduleKey) {
    if (!moduleKey) return false;
    if (moduleKey === "hairCare") {
      const permEnabled = this.uiSettings?.permissions?.hairEnabled !== false;
      const moduleEnabled = this.uiSettings?.modules?.hairCare?.enabled !== false;
      return permEnabled && moduleEnabled;
    }
    if (moduleKey === "skinCare") {
      const permEnabled = this.uiSettings?.permissions?.skinEnabled !== false;
      const moduleEnabled = this.uiSettings?.modules?.skinCare?.enabled !== false;
      return permEnabled && moduleEnabled;
    }
    return false;
  }

  _getSystemStyles(status) {
    const base = "margin: 10px; padding: 12px; border-radius: 8px; font-size: 13px; border: 1px solid; line-height: 1.4;";
    switch (status) {
      case 'error':
        return `${base} background: #FEF2F2; color: #991B1B; border-color: #FEE2E2;`;
      case 'success':
        return `${base} background: #F0FDF4; color: #166534; border-color: #DCFCE7;`;
      case 'warning':
      default:
        return `${base} background: #FFFBEB; color: #92400E; border-color: #FEF3C7;`;
    }
  }

  _addWarningToTimeline(message) {
    this.state.timeline.push({
      type: 'system',
      status: 'warning',
      text: message,
    });
    this.renderChatUI();
  }

  _handleUnauthorizedAccess() {
    this._addWarningToTimeline("⚠️ Please log in to your account to start your AI analysis. Redirecting to login page in few seconds...")

    setTimeout(() => {
      window.location.href = "/account/login";
    }, 3000);
  }

  renderChatUI() {
    const screen = document.getElementById("derma-ai-screen");
    if (!screen) return;

    const bubbleConfig = this.uiSettings.drawer?.bubble;

    screen.innerHTML = this.state.timeline
      .map((m) => {
        const content = `
        ${m.heading ? `<div class="derma-ai-bubble-heading">${m.heading}</div>` : ""}
        ${m.text ? `<div class="derma-ai-bubble-text">${m.text || ""}</div>` : ""} 
        `;
        if (m.type === "bot") {
          const withAvatar = m.assistant ? " with-avatar" : "";
          const avatar = m.assistant
            ? `<div class="derma-ai-assistant-avatar" aria-hidden="true">
                 <img src="${this.assets.aiIcon}" alt="report" />
               </div>`
            : "";
          return `<div class="chat-row bot${withAvatar}">
                    ${avatar}
                    <div class="derma-ai-bot-bubble">
                      ${content}
                    </div>
                  </div>`;
        }
        if (m.type === "user")
          return `<div class="chat-row user">
                    <div class="derma-ai-user-bubble">
                      ${content}
                    </div>
                  </div>`;
        if (m.type === "ui") return `<div class="derma-ai-chat-ui-block">${m.html}</div>`;
        if (m.type === "system") {
          const styles = this._getSystemStyles(m.status); // error, warning, success
          return `
          <div class="chat-system-row" style="${styles}">
            ${m.text}
          </div>`;
        }
        return "";
      })
      .join("");

    if (bubbleConfig?.boat) {
      screen.querySelectorAll(".chat-row.bot .derma-ai-bot-bubble").forEach((el) => {
        this._applyBubbleStyles(el, bubbleConfig.boat);
      });
    }
    if (bubbleConfig?.user) {
      screen.querySelectorAll(".chat-row.user .derma-ai-user-bubble").forEach((el) => {
        this._applyBubbleStyles(el, bubbleConfig.user);
      });
    }

    screen.scrollTop = screen.scrollHeight;
  }

  addBot(obj) {
    if (!obj || Object.keys(obj).length === 0) return;
    this.state.timeline.push({ type: "bot", ...obj });
    this.renderChatUI();
  }

  addUser(obj) {
    if (!obj || Object.keys(obj).length === 0) return;
    this.state.timeline.push({ type: "user", ...obj });
    this.renderChatUI();
  }

  /**
   * Append a UI block and run attachListeners on the new block’s root
   * so listeners bind to the correct DOM (no stale global queries).
   */
  addUI(html, attachListeners) {
    this.state.timeline.push({ type: "ui", html });
    this.renderChatUI();
    const blocks = document.querySelectorAll("#derma-ai-screen .derma-ai-chat-ui-block");
    const root = blocks[blocks.length - 1];
    if (root && typeof attachListeners === "function") {
      attachListeners(root);
    }
  }

  notifyError(message) {
    this.addBot({ text: message || "Something went wrong. Please try again." });
  }

  setActiveFlow() {
    // 1. Check Permissions (Subscription Plan level)
    const hasSkinPerm = this.uiSettings?.permissions?.skinEnabled ?? false;
    const hasHairPerm = this.uiSettings?.permissions?.hairEnabled ?? false;

    // 2. Check Active Status (Merchant toggle level)
    const isSkinActive = this.uiSettings?.modules?.skinCare?.enabled ?? false;
    const isHairActive = this.uiSettings?.modules?.hairCare?.enabled ?? false;

    if (!hasSkinPerm && !hasHairPerm) {
      this._addWarningToTimeline("🚫 Access Denied. Please upgrade your plan to enable AI Skin and Hair analysis.");
      return "no-permission";
    }

    if ((hasSkinPerm || hasHairPerm) && (!isSkinActive && !isHairActive)) {
      this._addWarningToTimeline("⚠️ Modules Inactive. Please enable the Skin or Hair advisor from the app settings.");
      return "not-active";
    }

    // SCENARIO C: Logic to set the default flow if at least one is enabled
    if (isSkinActive) {
      this.state.activeFlow = "skinCare";
    } else if (isHairActive) {
      this.state.activeFlow = "hairCare";
    }
    return "success";

  }

  /* ---------- Session & submit ---------- */

  async startSession() {
    // console.log("Run::startSession")
    // console.log("start session", this.state)
    this.state.timeline = [];

    // console.log("flow type::", this.state.activeFlow)
    // this.state.activeFlow = "skinCare";

    if (!this.isFullPage) {
      this.createDrawer();
      const drawer = document.getElementById("derma-ai-drawer");
      if (drawer) drawer.classList.add("open");
      this.exitAssistantMode();
    } else {
      const screen = document.getElementById("derma-ai-screen");
      if (screen) screen.innerHTML = "";
    }

    if (!this.customer || !this.customer.id) {
      this._handleUnauthorizedAccess();
      return;
    }

    const res = this.setActiveFlow()
    if (res === 'not-active') return;

    this.renderChatUI();

    // Check daily scan limit before starting (uses logged-in customer identity)
    const limitCheck = await this.apiService.checkScanLimit(this.state.customerId);
    if (!limitCheck?.data?.allowed) {
      const resetTime = limitCheck?.data?.nextAvailableAt
        ? new Date(limitCheck.data.nextAvailableAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " UTC"
        : "midnight UTC";
      this.addBot({
        text: `⛔ You've used your daily scan limit (${limitCheck?.data?.scansLimit || 2} scans/day). Your limit resets at ${resetTime}.`,
      });
      return;
    }

    this.addBot({ text: "⏳ Preparing your personalized assessment..." });

    // console.log("timeline:::", this.state.timeline)
    const payload = {
      platform: "web",
      flowType: this.flowConfig.skinCare.flowType, // Sent dynamically (skin_flow or hair_flow)
      // customer: this.customer
    }
    const { data, error } = await this.apiService.startSession(payload)
    // console.log("sucess::sexxions", data, error)

    if (error) {
      this.addBot({ text: "❌ Unable to start session." });
      return;
    }

    this.state.sessionId = data.session_id;
    this.state.analysisCompleted = false;
    this._recordCustomerAndSession().catch((err) => console.warn("analytics", err));
    this.updateHeaderTitle(this.flowConfig[this.state.activeFlow].title);
    this.addBot({ text: this.flowConfig[this.state.activeFlow].welcome });

    if (data.ui) {
      this.addBot({
        heading: data.ui.heading,
        text: data.ui.intro_message
      })
      this.renderUI(data.ui);
    }
  }

  async _recordCustomerAndSession() {
    if (!this.customer?.id) return;
    const customerRes = await this.apiService.upsertCustomer({
      shopifyCustomerId: this.customer.id,
      email: this.customer.email,
      firstName: this.customer.firstName,
      lastName: this.customer.lastName,
    });
    const customerId = customerRes?.data?.customerId;
    if (!customerId) return;
    this.state.customerId = customerId;

    const sessionRes = await this.apiService.recordAnalysisStart({
      customerId,
      externalSessionId: this.state.sessionId,
      flowType: this.flowConfig[this.state.activeFlow]?.flowType,
    });

    if (sessionRes?.code === "DAILY_LIMIT_REACHED") {
      const resetTime = sessionRes.nextAvailableAt
        ? new Date(sessionRes.nextAvailableAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " UTC"
        : "midnight UTC";
      this.addBot({ text: `⛔ Daily scan limit reached. Try again after ${resetTime}.` });
      return;
    }
    if (sessionRes?.code === "USAGE_LIMIT_REACHED") {
      this.addBot({ text: "⛔ Monthly scan limit reached. Please upgrade your plan to continue." });
      return;
    }

    if (sessionRes?.data?.sessionId) {
      this.state.aiSessionId = sessionRes.data.sessionId;
    }
  }

  async _recordAnalysisCompleted() {
    if (this.state.analysisCompleted) return;
    this.state.analysisCompleted = true;
    if (!this.state.aiSessionId && !this.state.sessionId) return;
    await this.apiService.recordAnalysisComplete({
      sessionId: this.state.aiSessionId || undefined,
      externalSessionId: this.state.sessionId || undefined,
    }).catch((err) => console.warn("analytics complete", err));
  }

  async submitStep(stepId, responseValue) {
    if (!this.state.sessionId || this.state.isSubmitting) return;

    this.state.isSubmitting = true;

    const payload = {
      session_id: this.state.sessionId,
      step_id: stepId,
      response: responseValue,
      flowType: this.flowConfig[this.state.activeFlow].flowType,
    }

    const { data, error } = await this.apiService.submitStep(payload)

    if (error) {
      this.notifyError("❌ We couldn’t save that step. Please try again.");
      return;
    }
    this.state.isSubmitting = false;

    if (stepId === "product_recommendation_start") {
      this.apiService.recordProductRecommendation({
        sessionId: this.state.aiSessionId || undefined,
        externalSessionId: this.state.sessionId || undefined,
      }).catch((err) => console.warn("product recommendation count", err));
    }

    if (data?.ui) {
      if (data?.ui?.ui_type !== "ai_report") {
        this.addBot({
          heading: data?.ui?.heading || "",
          text: data?.ui?.message || ""
        })
      }
      this.renderUI(data?.ui);
    }
  }

  /* ---------- UI engine: step type → renderer ---------- */

  renderUI(ui) {
    if (!ui) return;

    this.state.currentStep = ui.step_id;


    const type = ui.ui_type;
    switch (type) {
      case "card_select":
        this.renderCardSelect(ui);
        break;
      case "pill_list":
        this.renderPillList(ui);
        break;
      case "button_list":
        this.renderButtonList(ui);
        break;
      case "multi_select":
        this.renderMultiSelect(ui);
        break;
      case "image_upload":
        this.renderImageUpload(ui);
        break;
      case "analysis_cards":
        this.renderAnalysisCards(ui);
        break;
      case "product_routine":
      case "hair_product_routine":
        this.renderRoutine(ui);
        break;
      case "ai_report":
        this.renderAIReport(ui);
        break;
      case "final_actions":
        this.renderFinalActions(ui);
        break;
      case "action_button":
        this.renderActionButton(ui);
        break;
      default:
        console.warn("Unsupported UI:", type, ui);
    }
  }

  /* ---------- Step renderers ---------- */

  renderCardChooseConcern(ui) {
    const filteredOptions = (ui.options || []).filter((o) => {
      if (ui.step_id === "choose_concern") {
        if (o.id === "hair_assessment") return this._isModuleEnabled("hairCare");
        if (o.id === "skin_assessment") return this._isModuleEnabled("skinCare");
      }
      return true; // Show other options by default
    }).map((o) => {
      if (ui.step_id === "choose_concern") {
        let moduleKey = "";
        if (o.id === "hair_assessment") moduleKey = "hairCare"
        if (o.id === "skin_assessment") moduleKey = "skinCare"

        if (moduleKey) {
          return {
            ...o,
            config: this.uiSettings?.modules?.[moduleKey] || {}
          };
        } else {
          return { ...o }
        }
      }
      return o;
    });

    const html = `
    <div class="card-select-grid">
      ${(filteredOptions)
        .map((o) => {
          const text = o.config?.text || {};
          const img = o.config?.image || {};
          const displayLabel = text.label || o.label;
          const displayImage = this._resolveAssetUrl(img.url) || this._resolveAssetUrl(o.image);
          return (`
              <div 
                class="card-select-item derma-card-choose_concern" 
                data-id="${this.escapeHtml(o.id)}"
              >
              <div 
                class="derma-card-image-wrapper-choose_concern" 
                style="
                    width: ${img.width || 48}px; 
                    height: ${img.height || 48}px; 
                    border-radius: ${img.radius || 12}px;"
              >
                ${displayImage ? `<img src="${this.escapeHtml(displayImage)}" alt="" style="width: 100%; height: 100%; object-fit: cover;" />` : ""}
              </div>
              <div>
                <div 
                  class="derma-card-title-choose_concern"
                  style="
                  color: ${text.textColor || '#111827'}; 
                  font-size: ${text.fontSize || 14}px; 
                  font-weight: ${text.fontWeight || "normal"};
                  line-height: 1.2;"
                >
                  ${this.escapeHtml(displayLabel)}
                </div>
              </div>
              </div>`)
        }
        )
        .join("")}
    </div>`;

    this.addUI(html, (root) => {
      root.querySelectorAll(".card-select-item").forEach((el) => {
        el.addEventListener("click", () => {
          const title = el.querySelector(".derma-card-title-choose_concern").textContent;
          this.addUser({ text: title });

          if (ui.step_id === "choose_concern") {
            this.state.activeFlow = el.dataset.id === "hair_assessment" ? "hairCare" : "skinCare";
            this.updateHeaderTitle(this.flowConfig[this.state.activeFlow].title);
          }

          this.submitStep(ui.step_id, el.dataset.id);
        });
      });
    });
  }

  renderCardSelect(ui) {
    if (ui.step_id === "choose_concern") {
      this.renderCardChooseConcern(ui)
    } else {
      this.addUI(`
        <div class="card-select-grid">
          ${(ui.options || [])
          .map(
            (o) => `
            <div class="card-select-item" data-id="${this.escapeHtml(o.id)}">
              ${o.image ? `<img src="${this.escapeHtml(o.image)}" />` : ""}
              <div class="derma-card-title">${this.escapeHtml(o.label)}</div>
            </div>`
          )
          .join("")}
        </div>
      `);

      document.querySelectorAll(".card-select-item").forEach((el) => {
        el.onclick = () => {
          this.addUser({ text: el.querySelector(".derma-card-title").textContent });
          this.submitStep(ui.step_id, el.dataset.id);
        };
      });
    }
  }

  renderPillList(ui) {
    const html = `
    <div class="pill-list">
      ${(ui.options || [])
        .map((o) => `<div class="pill-item">${this.escapeHtml(o)}</div>`)
        .join("")}
    </div>`;

    this.addUI(html, (root) => {
      root.querySelectorAll(".pill-item").forEach((el) => {
        el.addEventListener("click", () => {
          this.addUser({ text: el.textContent });
          this.submitStep(ui.step_id, el.textContent);
        });
      });
    });
  }

  renderButtonList(ui) {
    const html = `
    <div class="btn-list">
      ${(ui.options || [])
        .map((o) => `<button type="button" class="figma-btn">${this.escapeHtml(o)}</button>`)
        .join("")}
    </div>`;

    this.addUI(html, (root) => {
      root.querySelectorAll(".btn-list .figma-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.addUser({ text: btn.textContent });
          this.submitStep(ui.step_id, btn.textContent);
        });
      });
    });
  }

  renderMultiSelect(ui) {
    const selected = new Set();
    const btnId = `multi-${this.sanitizeDomId(ui.step_id)}`;

    const html = `
    <div class="derma-ai-goal-grid">
      ${(ui.options || [])
        .map(
          (o) => `
        <div class="derma-ai-goal-item" data-id="${this.escapeHtml(o.id)}">${this.escapeHtml(
            o.label
          )}</div>
      `
        )
        .join("")}
    </div>
    <button type="button" class="figma-btn primary" id="${btnId}">Continue</button>`;

    this.addUI(html, (root) => {
      root.querySelectorAll(".derma-ai-goal-item").forEach((el) => {
        el.addEventListener("click", () => {
          el.classList.toggle("active");
          if (selected.has(el.dataset.id)) selected.delete(el.dataset.id);
          else selected.add(el.dataset.id);
        });
      });

      const continueBtn = this.queryById(root, btnId);
      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          if (!selected.size) {
            this.addBot({ text: "⚠ Please select at least one option." });
            return;
          }
          const payload = [...selected];
          const optionsLabels = ui.options.filter((opt) => payload.includes(opt?.id)).map((opt) => opt?.label)
          this.addUser({ text: optionsLabels.join(", ") });
          this.addBot({ text: "⏳ Generating your personalized routine..." });
          this.submitStep(ui.step_id, payload);
        });
      }
    });
  }

  renderActionButton(ui) {
    const btnId = `action-${this.sanitizeDomId(ui.step_id)}`;

    const html = `
    <div class="action-button-wrapper">
      <button type="button" class="figma-btn primary" id="${btnId}">
        ${this.escapeHtml(ui.label || "Continue")}
      </button>
    </div>`;

    this.addUI(html, (root) => {
      const btn = this.queryById(root, btnId);
      if (btn) {
        btn.addEventListener("click", () => {
          this.addUser({ text: ui.label || "Continue" });
          this.submitStep(ui.step_id, ui.value || "continue");
        });
      }
    });
  }

  renderImageUpload() {
    const inputId = `img-upload-${this.sanitizeDomId(this.state.sessionId || "session")}`;

    // const html = `<input type="file" id="${inputId}" accept="image/*" aria-label="Upload image" />`;
    const html = `
    <div class="derma-upload-container">
      <input type="file" id="${inputId}" accept="image/*" aria-label="Upload image" style="display: none;" />
      <label for="${inputId}" class="derma-upload-label">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Upload Image</span>
      </label>
    </div>
  `;

    this.addUI(html, (root) => {
      const input = this.queryById(root, inputId);
      if (!input) return;

      input.addEventListener("change", async (e) => {
        const file = e.target?.files?.[0];
        if (!file) {
          this.notifyError("⚠ Please choose an image file.");
          return;
        }

        const fd = new FormData();
        fd.append("session_id", this.state.sessionId);
        fd.append("image", file);
        fd.append("analysis_type", this.state.activeFlow);

        this.addUser({ text: "📸 Photo uploaded" });
        this.addBot({ text: "⏳ Analyzing image..." });

        const { data, error } = await this.apiService.uploadImage(fd);

        if (error) {
          console.error(error);
          this.notifyError("❌ Image upload failed. Please try another photo.");
          // Some time Failing Imgae uplod
          // Need to new Session id for retry upload , if you got not proper image with valid reason
          // this.renderImageUpload()
          return;
        }

        // Image uploaded successfully — record 0.5 scan and enforce daily limit
        const uploadRes = await this.apiService.recordImageUploaded({
          sessionId: this.state.aiSessionId || undefined,
          externalSessionId: this.state.sessionId || undefined,
        });
        if (uploadRes?.code === "DAILY_LIMIT_REACHED") {
          const resetTime = uploadRes.nextAvailableAt
            ? new Date(uploadRes.nextAvailableAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " UTC"
            : "midnight UTC";
          this.addBot({ text: `⛔ Daily scan limit reached. Try again after ${resetTime}.` });
          return;
        }
        if (uploadRes?.code === "USAGE_LIMIT_REACHED") {
          this.addBot({ text: "⛔ Monthly scan limit reached. Please upgrade your plan to continue." });
          return;
        }

        if (data?.ui) {
          this.addBot({
            heading: data?.ui?.heading || "",
            text: data?.ui?.message || ""
          })
          this.renderUI(data.ui);
        }
      });
    });
  }

  renderAnalysisCards(ui) {
    const results = Array.isArray(ui.results) ? ui.results : [];

    const html = `
    <div class="analysis-grid">
      ${results
        .map(
          (group) => `
            <div class="analysis-group">
              <div class="analysis-group-title">${this.escapeHtml(group.category || "")}</div>

              <div class="analysis-group-list">
                ${(Array.isArray(group.conditions) ? group.conditions : [])
              .map(
                (condition) => `
                      <div class="analysis-card">
                        <b>${this.escapeHtml(condition.name || "")}</b>
                        <div>${this.escapeHtml(condition.confidence || 0)}%</div>
                        ${condition.location
                    ? `<small>${this.escapeHtml(condition.location)}</small>`
                    : ""
                  }
                      </div>
                    `
              )
              .join("")}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
    <button type="button" class="figma-btn primary" id="analysis-continue">Continue</button>`;

    this.addUI(html, (root) => {
      const btn = root.querySelector("#analysis-continue");
      if (btn) {
        btn.addEventListener("click", () => {
          this.addUser({ text: "Continue" });
          this.submitStep(ui.step_id, "continue");
        });
      }
    });
  }

  renderRoutine(ui) {
    const routine = Array.isArray(ui.routine) ? ui.routine : [];
    const nextBtnId = `next-ai-report-${this.sanitizeDomId(ui.step_id)}`;

    const html = `
    <div class="routine-wrapper">
      <h3>Your Personalized <span>Routine</span></h3>

      ${routine
        .map(
          (section) => `
          <div class="routine-step">

            <h4>${this.escapeHtml(section.category || "")}</h4>

            <div class="product-grid">

              ${(section.products || [])
              .map((p) => {
                const variantId = (p.variantId || "").split("/").pop();
                const price = (p.price || "").replace("INR ", "");
                const mrp = (p.compareAtPrice || "").replace("INR ", "");

                return `
                    <div class="product-card">
                      <div class="badge ${p.recommendationType === "Recommended" ? "rec" : "alt"
                  }">
                        ${this.escapeHtml(p.recommendationType || "")}
                      </div>
                      <a href="${this.escapeHtml(p.url || "#")}" target="_blank" rel="noopener noreferrer">
                        <img src="${this.escapeHtml(p.image || "")}" alt="" />
                      </a>
                      <div class="product-title">
                        ${this.escapeHtml(p.name || "")}
                      </div>
                      <div class="price">
                        ₹${this.escapeHtml(price)}
                        ${mrp
                    ? `<span>₹${this.escapeHtml(mrp)}</span>`
                    : ""
                  }
                      </div>
                      <button
                        type="button"
                        class="add-btn"
                        data-variant="${this.escapeHtml(variantId)}"
                      >
                        ADD
                      </button>
                    </div>
                  `;
              })
              .join("")}
            </div>
          </div>
        `
        )
        .join("")}
      <button type="button" class="figma-btn primary add-all">
        Add All to Cart
      </button>
      <button type="button" class="figma-btn primary" id="${nextBtnId}" style="margin-top:14px;">
        Next AI Doctor’s Report
      </button>
    </div>`;

    this.addUI(html, (root) => {
      root.querySelectorAll(".add-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.addToCart(btn.dataset.variant);
        });
      });

      const addAll = root.querySelector(".add-all");
      if (addAll) {
        addAll.addEventListener("click", () => this.addAllToCart(root));
      }

      const nextBtn = this.queryById(root, nextBtnId);
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          this.addUser({ text: "Next AI Doctor’s Report" });
          this.submitStep(ui.step_id, "continue");
        });
      }
    });
  }

  renderAIReport(ui) {
    this._recordAnalysisCompleted();
    const hasPdf = !!ui.pdf_url;
    const bubbleConfig = this.uiSettings.drawer?.bubble;

    const html = `
    <div class="derma-ai-report-wrapper">
      <div class="derma-ai-report-card"> 
        <span class="derma-ai-report-header derma-ai-bubble-heading">${ui?.heading}</span>
        <p class="derma-ai-report-desc derma-ai-bubble-text">${ui?.message}</p>

        <div class="derma-ai-report-card-main">
          <div class="derma-ai-report-card-body">
            <div class="derma-ai-report-header-group">
              <div class="derma-ai-report-icon-circle">
                <img src="${this.assets.reportIcon}" alt="report" />
              </div>
              <h4 class="derma-ai-reprot-card-main-heading ">${ui?.heading || 'Comprehensive Plan'}</h4>
            </div>

            <div class="derma-ai-report-details">
              <p class="derma-ai-reprot-card-heading"><b>Personalized Plan</b></p>
              <p class="derma-ai-date-text">Generated on: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          <button type="button" class="derma-ai-report-download-btn" data-action="download-report">
            <div class="derma-ai-download-pill-icon">
              <img src="${this.assets.downloadIcon}" alt="download" />
            </div>
            <span>Download</span>
          </button>
        </div>
      </div>

      <div class="ai-report-actions">
        <button type="button" class="figma-btn" data-final-action="start-over">Start Over</button>
        <button type="button" class="figma-btn primary" data-final-action="ai_assistant">AI Assistant</button>
      </div>
    </div>`;

    this.addUI(html, (root) => {
      const reportCard = root.querySelector(".derma-ai-report-card");
      if (reportCard && bubbleConfig) {
        this._applyBubbleStyles(reportCard, bubbleConfig);
      }
      const downloadBtn = root.querySelector("[data-action='download-report']");
      if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
          if (hasPdf) {
            window.open(ui.pdf_url, "_blank", "noopener,noreferrer");
          } else {
            window.alert("Report is still generating. Please try again in a moment.");
          }
        });
      }

      root.querySelectorAll("[data-final-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.handleFinalAction(btn.getAttribute("data-final-action"));
        });
      });
    });

  }

  /**
   * Handles post-report actions (also used by renderFinalActions for dynamic ids).
   * Merges both legacy duplicate handlers from the original script:
   * - start-over: restart session
   * - ai_assistant: user message + assistant reply (richer welcome copy preserved)
   */
  handleFinalAction(id) {
    if (id === "start-over") {
      this.startSession();
      return;
    }

    if (id === "ai_assistant") {
      this.addUser({ text: "AI Assistant" });
      this.enterAssistantMode();
      this.addBot({
        assistant: true,
        heading: "AI Assistant",
        text: this._getAssistantGreeting()
      });
    }
  }

  _getAssistantGreeting() {
    return this.state.activeFlow === "hairCare"
      ? "Hello! I'm your Dermatics AI Haircare Assistant. How can I help you with your new routine or hair analysis."
      : "Hello! I'm your Dermatics AI Skincare Assistant. How can I help you with your routine or skin analysis?";
  }

  enterAssistantMode() {
    const drawer = document.getElementById("derma-ai-drawer");
    if (!drawer) return;
    drawer.classList.add("has-composer");
    this.state.assistantMode = true;
    this.updateHeaderTitle("AI Assistant");
    setTimeout(() => {
      drawer.querySelector("#derma-ai-composer-input")?.focus();
    }, 60);
  }

  exitAssistantMode() {
    const drawer = document.getElementById("derma-ai-drawer");
    if (drawer) drawer.classList.remove("has-composer");
    this.state.assistantMode = false;
  }

  async sendAssistantMessage(text) {
    if (!text || this.state.isSubmitting) return;
    this.addUser({ text });

    const typingMarker = `__typing_${Date.now()}`;
    this.state.timeline.push({
      type: "ui",
      marker: typingMarker,
      html: `<div class="chat-row bot with-avatar">
               <div class="derma-ai-assistant-avatar" aria-hidden="true">
                  <img class="derma-ai-object-fit-contain" src="${this.assets.sendMsgIcon}" alt="ai-assistant-img" />
               </div>
               <div class="derma-ai-bot-bubble">
                 <div class="derma-ai-typing"><span class="derma-ai-dot"></span><span class="derma-ai-dot"></span><span class="derma-ai-dot"></span></div>
               </div>
             </div>`
    });
    this.renderChatUI();

    this.state.isSubmitting = true;
    const reply = await this._requestAssistantReply(text);
    this.state.isSubmitting = false;

    this.state.timeline = this.state.timeline.filter((m) => m.marker !== typingMarker);
    this.addBot({ assistant: true, text: reply });
  }

  async _requestAssistantReply(text) {
    // TODO: replace with a real chat endpoint when the backend is ready, e.g.:
    //   const { data, error } = await this.apiService.assistantChat({
    //     sessionId: this.state.sessionId,
    //     message: text,
    //     flowType: this.state.activeFlow,
    //   });
    //   if (error || !data?.reply) return "I couldn't reach the assistant right now. Please try again.";
    //   return data.reply;
    await new Promise((r) => setTimeout(r, 600));
    const preview = String(text).slice(0, 120);
    return `Thanks for asking about "${this.escapeHtml(preview)}". The chat backend isn't wired up yet — connect \`_requestAssistantReply\` to your API to return real responses.`;
  }

  renderFinalActions(ui) {
    const html = `
    <div class="final-actions">
      ${(ui.actions || [])
        .map(
          (a) =>
            `<button type="button" class="figma-btn" data-final-action="${this.escapeHtml(
              a.id
            )}">${this.escapeHtml(a.label)}</button>`
        )
        .join("")}
    </div>`;

    this.addUI(html, (root) => {
      root.querySelectorAll("[data-final-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.handleFinalAction(btn.getAttribute("data-final-action"));
        });
      });
    });
  }

  /* ---------- Shopify cart ---------- */

  // Stamps the current cart with `ai_dermatics_*` note_attributes so the
  // orders/create webhook can attribute the purchase back to this session.
  async _stampCartAttribution() {
    const attributes = {};
    if (this.state.sessionId) attributes.ai_dermatics_session = String(this.state.sessionId);
    if (this.state.customerId) attributes.ai_dermatics_customer = String(this.state.customerId);
    if (this.state.aiSessionId) attributes.ai_dermatics_ai_session = String(this.state.aiSessionId);
    if (!Object.keys(attributes).length) return;

    const cartRoot = window.Shopify?.routes?.root || "/";
    try {
      await fetch(`${cartRoot}cart/update.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes }),
      });
    } catch (e) {
      console.warn("cart attribution", e);
    }
  }

  async addToCart(variantId) {
    if (this.state.isSubmitting || !variantId) return;

    this.state.isSubmitting = true;

    const cartRoute = (window.Shopify?.routes?.root || '/') + 'cart/add.js';
    const formData = {
      items: [{
        id: Number(variantId),
        quantity: 1
      }]
    };

    await this._stampCartAttribution();

    fetch(cartRoute, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          // Handle Shopify error (e.g., out of stock)
          this.state.timeline.push({
            type: 'system',
            status: 'error',
            text: `❌ ${data.description || data.message || "Could not add to cart."}`
          });
        } else {
          // Handle Success
          this.state.timeline.push({
            type: 'system',
            status: 'success',
            text: "✅ Added to cart! Redirecting..."
          });
          setTimeout(() => window.location.href = "/cart", 1500);
        }
      })
      .catch(err => {
        // Handle Network error
        this.state.timeline.push({
          type: 'system',
          status: 'error',
          text: "❌ Network error. Please try again."
        });
      })
      .finally(() => {
        this.state.isSubmitting = false;
        this.renderChatUI();
      });
  }

  async addAllToCart(scopeRoot = document) {
    const items = [];

    scopeRoot.querySelectorAll(".add-btn").forEach((btn) => {
      const v = btn.dataset.variant;
      if (v) items.push({ id: Number(v), quantity: 1 });
    });

    if (!items.length) {
      window.alert("No products available to add");
      return;
    }

    await this._stampCartAttribution();

    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        let err = {};
        try {
          err = await res.json();
        } catch {
          /* ignore */
        }
        window.alert(err.description || err.message || "Could not add items to cart.");
      }
    } catch (e) {
      console.error("addAllToCart", e);
      window.alert("Network error while adding to cart.");
    }
  }
}

/** Expose class for multiple instances: `new DermaAIWizard({ baseUrl, flowConfig })` */
if (typeof window !== "undefined" && !window.__DERMA_AI_BOOTED) {
  window.__DERMA_AI_BOOTED = true;
  window.DermaAIWizard = DermaAIWizard;

  const dermaAIWizard = new DermaAIWizard({
    proxy: "/apps/derma-advisor",
    baseUrl: "https://app.dermatics.in",
    customer: window.DERMA_AI_CUSTOMER,
    assets: window.DERMA_AI_APP_ASSETS
  });

  console.log("starting the APP-----")
  dermaAIWizard.initLauncher();
}