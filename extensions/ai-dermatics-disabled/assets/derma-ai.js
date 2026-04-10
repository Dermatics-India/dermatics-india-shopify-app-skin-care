/**
 * Generic API Handler for JSON and Multipart requests
 */
class ApiHandler {
  constructor(apiURL) {
    // this.apiURL = apiURL.replace(/\/$/, ""); // Remove trailing slash if exists
  }

  /**
   * Standardized Response Handler
   */
  async #handleResponse(res) {
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => ({})) : {};

    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        message: data.message || "Request failed",
        ...data
      };
    }
    return data;
  }

  /**
   * GET Request with Query Params
   */
  async get(url, params = {}) {
    try {
      const query = Object.keys(params).length
        ? `?${new URLSearchParams(params)}`
        : "";

      const res = await fetch(`${url}${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      return await this.#handleResponse(res);
    } catch (e) {
      return { error: true, message: e.message };
    }
  }

  /**
   * POST Request (JSON or Multipart)
   */
  async post(url, payload, isMultipart = false) {
    try {
      const headers = { "Accept": "application/json" };
      // Only set Content-Type if it's NOT multipart
      if (!isMultipart) {
        headers["Content-Type"] = "application/json";
      }
      const options = {
        method: "POST",
        body: isMultipart ? payload : JSON.stringify(payload),
        headers: headers
      };

      const res = await fetch(url, options);
      return await this.#handleResponse(res);
    } catch (e) {
      return { error: true, message: e.message };
    }
  }
}

/**
 * DermaAIWizard — production-ready dermatology assessment flow.
 * UI rendering, API calls, and Shopify cart are encapsulated on the instance.
 */
class DermaAIWizard {
  static defaultFlowConfig() {
    return {
      skin: {
        flowType: "skin_flow",
        title: "AI Skin Advisor",
        welcome: "👋 Hello! I'm your Dermatics AI Skincare Assistant.",
      },
      hair: {
        flowType: "hair_flow",
        title: "AI Hair Advisor",
        welcome: "👋 Hi! I'm your Dermatics AI Hair Assistant.",
      },
    };
  }

  constructor(config = {}) {
    this.baseUrl = config.baseUrl;
    this.proxy = config.proxy || "/apps/derma-advisor";  // Enable it While using Proxy 
    this.endpoints = {
      sessionStart: `${this.baseUrl}/api/session/start`,
      flowSubmit: `${this.baseUrl}/api/flow/submit`,
      imageUpload: `${this.baseUrl}/api/flow/upload-image`,
      settings: `${this.proxy}/widget-settings`,
    };

    this.api = new ApiHandler();

    this.flowConfig = DermaAIWizard.mergeFlowConfig(
      DermaAIWizard.defaultFlowConfig(),
      config.flowConfig || {}
    );

    this.state = {
      sessionId: null,
      currentStep: null,
      activeFlow: "skin",
      isSubmitting: false,
      timeline: [],
    };

    this.uiSettings = {};

    /** Cached once at construction; full-page embeds suppress the floating launcher */
    this.isFullPage = !!document.getElementById("derma-full-page-container");

    this.ready = this._initLauncher();
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
      fontFamily: styleObj.fontFamily || styleObj.font || "inherit"
    };

    Object.assign(el.style, styles);
  }

  /* ---------- Full page proxy: suppress floating launcher ---------- */

  async _initLauncher() {
    console.log("flowConfig:::", this.flowConfig)
    const settings = await this.getSettings();

    // console.log("ui settings", settings);
    // console.log("isFullPage", this.isFullPage);

    if (this.isFullPage) {
      console.log("Full-page proxy detected: floating launcher suppressed.");
      return;
    }
    if (document.getElementById("derma-ai-launcher")) return;

    const config = settings.widget || {};
    const btn = document.createElement("div");
    btn.id = "derma-ai-launcher";
    btn.className = "derma-ai-launcher";

    // Handle Icon vs Text display
    btn.textContent = config.buttonText || "Analyze Skin";
    this._applyDynamicStyles(btn, config);
    // btn.style.cssText =  
    // "position:fixed;bottom:20px;right:20px;background:#2563EB;color:#fff;padding:14px 22px;border-radius:50px;cursor:pointer;z-index:999999;box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight: 600;";
    btn.addEventListener("click", () => this.startSession());
    document.body.appendChild(btn);
  }

  /* ---------- API Calls ---------- */
  async getSettings() {
    const res = await this.api.get(this.endpoints.settings);
    if (res?.error) {
      console.error("DermaAIWizard API error", res);
      this.uiSettings = {};
      return this.uiSettings;
    }
    const dataObj = res?.data || {};

    console.log("settings:::response", dataObj);
    this.uiSettings = dataObj;
    return dataObj;
  }

  /* ---------- DOM: drawer ---------- */

  createDrawer() {
    if (document.getElementById("derma-ai-drawer")) return;

    const config = this.uiSettings.drawer || {};
    const drawer = document.createElement("div");
    drawer.id = "derma-ai-drawer";

    console.log("config:::",  config)
    // Apply Main Drawer Background
    drawer.style.backgroundColor = config.bgColor || "#ffffff";

    // Drawer header Ele
    drawer.innerHTML = `
      <div class="derma-ai-drawer-header" id="derma-drawer-header">
        <span id="derma-ai-header-title">AI Skin & Hair Advisor</span>
        <span class="wizard-close" style="color: ${config?.header?.textColor || "#fff"}" role="button" aria-label="Close">&times;</span>
      </div>
      <div id="derma-ai-screen" class="derma-ai-chat-screen"></div>
    `;
    document.body.appendChild(drawer);

    // Apply styles to the Header element
    const headerEl = drawer.querySelector("#derma-drawer-header");
    this._applyDynamicStyles(headerEl, config.header);

    drawer.querySelector(".wizard-close").addEventListener("click", () => {
      drawer.classList.remove("open");
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

  renderChatUI() {
    const screen = document.getElementById("derma-ai-screen");
    if (!screen) return;

    const bubbleConfig = this.uiSettings.drawer?.bubble;

    screen.innerHTML = this.state.timeline
      .map((m) => {
        if (m.type === "bot")
          return `<div class="chat-row bot"><div class="bubble bot-bubble">${m.text}</div></div>`;
        if (m.type === "user")
          return `<div class="chat-row user"><div class="bubble user-bubble">${m.text}</div></div>`;
        if (m.type === "ui") return `<div class="chat-ui-block">${m.html}</div>`;
        return "";
      })
      .join("");

    // Apply dynamic styles to all bot bubbles
    if (bubbleConfig?.boat) {
      screen.querySelectorAll(".bot-bubble").forEach(el => {
        this._applyDynamicStyles(el, bubbleConfig?.boat);
        // Ensure width/height from your specific config are applied if present
        // if (bubbleConfig.width) el.style.width = `${bubbleConfig.width}px`;
        // if (bubbleConfig.height) el.style.minHeight = `${bubbleConfig.height}px`;
      });
    }
    if (bubbleConfig?.user) {
      screen.querySelectorAll(".user-bubble").forEach(el => {
        this._applyDynamicStyles(el, bubbleConfig?.user);
      });
    }

    screen.scrollTop = screen.scrollHeight;
  }

  addBot(text) {
    if (!text) return;
    this.state.timeline.push({ type: "bot", text: this.escapeHtml(text) });
    this.renderChatUI();
  }

  addUser(text) {
    this.state.timeline.push({ type: "user", text: this.escapeHtml(text) });
    this.renderChatUI();
  }

  /**
   * Append a UI block and run attachListeners on the new block’s root
   * so listeners bind to the correct DOM (no stale global queries).
   */
  addUI(html, attachListeners) {
    this.state.timeline.push({ type: "ui", html });
    this.renderChatUI();
    const blocks = document.querySelectorAll("#derma-ai-screen .chat-ui-block");
    const root = blocks[blocks.length - 1];
    if (root && typeof attachListeners === "function") {
      attachListeners(root);
    }
  }

  notifyError(message) {
    this.addBot(message || "Something went wrong. Please try again.");
  }

  /* ---------- Session & submit ---------- */

  async startSession() {
    this.state.activeFlow = "skin";
    this.state.timeline = [];

    if (!this.isFullPage) {
      this.createDrawer();
      const drawer = document.getElementById("derma-ai-drawer");
      if (drawer) drawer.classList.add("open");
    } else {
      const screen = document.getElementById("derma-ai-screen");
      if (screen) screen.innerHTML = "";
    }

    this.renderChatUI();
    this.addBot("⏳ Preparing your personalized assessment...");

    const data = await this.api.post(this.endpoints.sessionStart, {
      platform: "web",
      flowType: this.flowConfig.skin.flowType,
    });

    if (!data || data.error) {
      this.addBot("❌ Unable to start session.");
      return;
    }

    this.state.sessionId = data.session_id;
    this.updateHeaderTitle(this.flowConfig[this.state.activeFlow].title);
    this.addBot(this.flowConfig[this.state.activeFlow].welcome);
    this.renderUI(data.ui);
  }

  async submitStep(stepId, responseValue) {
    if (!this.state.sessionId || this.state.isSubmitting) return;

    this.state.isSubmitting = true;
    const res = await this.api.post(this.endpoints.flowSubmit, {
      session_id: this.state.sessionId,
      step_id: stepId,
      response: responseValue,
      flowType: this.flowConfig[this.state.activeFlow].flowType,
    });

    this.state.isSubmitting = false;

    if (res?.error) {
      this.notifyError("❌ We couldn’t save that step. Please try again.");
      return;
    }
    if (res?.ui) this.renderUI(res.ui);
  }

  /* ---------- UI engine: step type → renderer ---------- */

  renderUI(ui) {
    if (!ui) return;

    this.state.currentStep = ui.step_id;

    if (ui.ui_type !== "ai_report") {
      if (ui.heading) this.addBot(ui.heading);
      if (ui.message) this.addBot(ui.message);
    }

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
        const isHair = o.id === "hair_assessment";
        const isSkin = o.id === "skin_assessment";

        if (isHair) {
          const flag = this.uiSettings?.flags?.hairEnabled !== false;
          const module = this.uiSettings?.modules?.hairCare?.enabled !== false;
          return flag && module;
        }

        if (isSkin) {
          const flag = this.uiSettings?.flags?.skinEnabled !== false;
          const module = this.uiSettings?.modules?.skinCare?.enabled !== false;
          return flag && module;
        }
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

    console.log("filteredOptions----", filteredOptions)

    const html = `
    <div class="card-select-grid">
      ${(filteredOptions)
        .map((o) => {
            const text = o.config?.text || {};
            const img = o.config?.image || {};
            const displayLabel = text.label || o.label;
            const displayImage = img.url || o.image;
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
                  font-weight: ${text.fontWeight || '600'};
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
          this.addUser(title);

          if (ui.step_id === "choose_concern") {
            this.state.activeFlow = el.dataset.id === "hair_assessment" ? "hair" : "skin";
            this.updateHeaderTitle(this.flowConfig[this.state.activeFlow].title);
          }

          this.submitStep(ui.step_id, el.dataset.id);
        });
      });
    });
  }

  renderCardSelect(ui) {
    console.log("render card----", ui)
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
          this.addUser(el.querySelector(".derma-card-title").textContent);
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
          this.addUser(el.textContent);
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
          this.addUser(btn.textContent);
          this.submitStep(ui.step_id, btn.textContent);
        });
      });
    });
  }

  renderMultiSelect(ui) {
    const selected = new Set();
    const btnId = `multi-${this.sanitizeDomId(ui.step_id)}`;

    const html = `
    <div class="goal-grid">
      ${(ui.options || [])
        .map(
          (o) => `
        <div class="goal-item" data-id="${this.escapeHtml(o.id)}">${this.escapeHtml(
            o.label
          )}</div>
      `
        )
        .join("")}
    </div>
    <button type="button" class="figma-btn primary" id="${btnId}">Continue</button>`;

    this.addUI(html, (root) => {
      root.querySelectorAll(".goal-item").forEach((el) => {
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
            this.addBot("⚠ Please select at least one option.");
            return;
          }
          const payload = [...selected];
          this.addUser(payload.join(", "));
          this.addBot("⏳ Generating your personalized routine...");
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
          this.addUser(ui.label || "Continue");
          this.submitStep(ui.step_id, ui.value || "continue");
        });
      }
    });
  }

  renderImageUpload(ui) {
    const inputId = `img-upload-${this.sanitizeDomId(this.state.sessionId || "session")}`;

    const html = `<input type="file" id="${inputId}" accept="image/*" aria-label="Upload image" />`;

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

        this.addUser("📸 Photo uploaded");
        this.addBot("⏳ Analyzing image...");

        const res = await this.api.post(this.endpoints.imageUpload, fd, true);

        if (res?.error) {
          this.notifyError("❌ Image upload failed. Please try another photo.");
          return;
        }
        if (res?.ui) this.renderUI(res.ui);
        else this.notifyError("❌ No response after upload. Please try again.");
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
          this.addUser("Continue");
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
          this.addUser("Next AI Doctor’s Report");
          this.submitStep(ui.step_id, "continue");
        });
      }
    });
  }

  renderAIReport(ui) {
    const hasPdf = !!ui.pdf_url;

    const html = `
    <div class="ai-report-wrapper">
      <span class="step">Step 5: AI Doctor's Report</span>
      <p>Here is a summary of your analysis and personalized plan.</p>

      <div class="ai-report-card-main">
        <div class="ai-report-card-top">
          <div class="icon">🧑‍⚕️</div>
          <div class="text">
            <h4>AI Doctor's Report</h4>
            <p><b>Personalized Skincare Plan</b></p>
            <p class="date">Generated on: ${new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>

        <button type="button" class="ai-report-download-btn" data-action="download-report">
          ⬇ Download Report
        </button>
      </div>

      <div class="ai-report-actions">
        <button type="button" class="figma-btn" data-final-action="start-over">Start Over</button>
        <button type="button" class="figma-btn primary" data-final-action="ai_assistant">AI Assistant</button>
      </div>
    </div>`;

    this.addUI(html, (root) => {
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
      this.addUser("AI Assistant");
      this.addBot(
        "Hello! I'm your Dermatics AI Skincare Assistant. How can I help you with your routine or skin analysis?"
      );
    }
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

  async addToCart(variantId) {
    if (!variantId) {
      window.alert("Product variant missing");
      return;
    }

    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(variantId), quantity: 1 }),
      });

      if (!res.ok) {
        let err = {};
        try {
          err = await res.json();
        } catch {
          /* ignore */
        }
        window.alert(err.description || err.message || "Could not add to cart.");
        return;
      }
    } catch (e) {
      console.error("addToCart", e);
      window.alert("Network error while adding to cart.");
    }
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
if (typeof window !== "undefined") {
  window.DermaAIWizard = DermaAIWizard;
}

/** Default singleton */
const dermaAIWizard = new DermaAIWizard({
  proxy: "/apps/derma-advisor",
  baseUrl: "https://app.dermatics.in"
});
