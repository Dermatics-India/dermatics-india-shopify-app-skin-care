import { useTranslation } from "react-i18next";
import { getDynamicStyles, getWidgetPositionStyles } from "../../utils";

const FALLBACK_IMAGES = {
  skinCare:
    "https://res.cloudinary.com/daqajshsm/image/upload/v1765433722/Group_okm1lm.jpg",
  hairCare:
    "https://res.cloudinary.com/daqajshsm/image/upload/v1765433778/Frame_dboqnw.jpg",
};

function resolveImageUrl(url, moduleKey) {
  if (!url) return FALLBACK_IMAGES[moduleKey];
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Mirrors _applyTextStyles in the storefront JS so the preview renders
// heading / text rows exactly like the live widget will.
function bubbleTextStyle(cfg) {
  if (!cfg) return {};
  return {
    fontSize: cfg.fontSize != null ? `${cfg.fontSize}px` : undefined,
    fontWeight: cfg.fontWeight || undefined,
    color: cfg.color || undefined,
    margin: `${cfg.marginTop || 0}px ${cfg.marginRight || 0}px ${cfg.marginBottom || 0}px ${cfg.marginLeft || 0}px`,
  };
}

export function WidgetPreview({ type, data, permissions, isDrawerOpen, setIsDrawerOpen }) {
  const { t } = useTranslation();
  const widgetStyle = getDynamicStyles(data, "widget");
  const positionStyles = getWidgetPositionStyles(data.widget.position);

  const headerSubtitle =
    data.drawer.header.subtitle ?? "Your personal beauty & wellness advisor";
  const headerBrand = data.drawer.header.brand ?? "by Dermatics India";
  const headerTitle =
    data.drawer.header.title ||
    (type === "skinCare"
      ? t("Customization.settings.preview.headerSkin")
      : t("Customization.settings.preview.headerHair"));

  return (
    <div className="widget-preview-container">
      <div className="mock-storefront">
        <h2 className="mock-title">{t("Customization.settings.preview.title")}</h2>
        <p className="mock-description">{t("Customization.settings.preview.description")}</p>
        <div className="mock-content-shape" />
      </div>

      <div
        className="live-widget-button"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        style={{ ...widgetStyle, ...positionStyles }}
      >
        {data.widget.buttonText || "Analyze Skin"}
      </div>

      <div
        className="live-drawer"
        style={{
          right: isDrawerOpen ? 0 : "-100%",
          backgroundColor: data.drawer.bgColor,
        }}
      >
        <div
          className="drawer-header"
          style={{
            backgroundColor:
              data.drawer.header.bgColor !== "#333333"
                ? data.drawer.header.bgColor
                : "transparent",
            color: data.drawer.header.textColor,
            fontFamily: data.drawer.header.fontFamily,
            fontSize: `${data.drawer.header.fontSize}px`,
          }}
        >
          <div className="drawer-header-text">
            <div className="drawer-header-title">{headerTitle}</div>
            {headerSubtitle && (
              <div className="drawer-header-subtitle">{headerSubtitle}</div>
            )}
            {headerBrand && (
              <div className="drawer-header-brand">{headerBrand}</div>
            )}
          </div>
          <button
            type="button"
            className="drawer-header-close"
            onClick={() => setIsDrawerOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="drawer-content">
          <div className="drawer-timeline">Today, 10:41 AM</div>

          <div
            className="chat-bubble"
            style={{
              backgroundColor: data.drawer.bubble.boat.bgColor,
              borderRadius: `${data.drawer.bubble.boat.radius}px`,
            }}
          >
            <div style={bubbleTextStyle(data.drawer.bubble.boat.heading)}>
              {t("Customization.settings.preview.mockHeading") || "Welcome"}
            </div>
            <div style={bubbleTextStyle(data.drawer.bubble.boat.text)}>
              {t("Customization.settings.preview.mockMessage") ||
                "Hello! We are here to help you find the best items for your regimen."}
            </div>
          </div>

          <div className="module-list">
            {Object.keys(data.modules || {}).length > 0 &&
              Object.entries(data.modules)
                .filter(([key, config]) => {
                  if (key === "hairCare" && !permissions?.hairEnabled) return false;
                  if (key === "skinCare" && !permissions?.skinEnabled) return false;
                  return config.enabled;
                })
                .map(([id, config]) => (
                  <div
                    key={id}
                    className={`module-card${type === id ? " active" : ""}`}
                  >
                    <div
                      className="module-image-wrapper"
                      style={{
                        width: `${config.image.width}px`,
                        height: `${config.image.height}px`,
                        borderRadius: `${config.image.radius}px`,
                      }}
                    >
                      <img
                        src={resolveImageUrl(config.image.url, id)}
                        alt={config.text.label}
                        className="object-fit-cover"
                      />
                    </div>

                    <div className="module-card-text">
                      <div
                        style={{
                          fontWeight: config.text.fontWeight,
                          color: config.text.textColor,
                          fontSize: `${config.text.fontSize}px`,
                        }}
                      >
                        {config.text.label}
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          <div
            className="chat-bubble chat-bubble-user"
            style={{
              backgroundColor: data?.drawer?.bubble?.user?.bgColor || "#ececec",
              borderRadius: `${data.drawer.bubble.user.radius}px`,
            }}
          >
            <div style={bubbleTextStyle(data.drawer.bubble.user.text)}>
              I would like to do a quick analysis.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
