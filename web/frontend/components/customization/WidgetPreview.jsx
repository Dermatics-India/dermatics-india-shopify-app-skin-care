import React from "react";
import { useTranslation } from "react-i18next";
import { getWidgetPositionStyles, getDynamicStyles } from "../../utils";

export function WidgetPreview({ type, data, isDrawerOpen, setIsDrawerOpen }) {
  const { t } = useTranslation();

  const fallbackImages = {
    skinCare: "https://res.cloudinary.com/daqajshsm/image/upload/v1765433722/Group_okm1lm.jpg",
    hairCare: "https://res.cloudinary.com/daqajshsm/image/upload/v1765433778/Frame_dboqnw.jpg",
  };

  const resolveImageUrl = (url, moduleKey) => {
    // console.log("app url", import.meta.env.SHOPIFY_APP_URL)
    console.log("window.location.origin::", window.location.origin)
    if (!url) return fallbackImages[moduleKey];
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const widgetStyle = getDynamicStyles(data, 'widget');
  const positionStyles = getWidgetPositionStyles(data.widget.position);

  console.log("wiodget preview", data)

  return (
    <div className="widget-preview-container">
      {/* Mock Storefront */}
      <div className="mock-storefront">
        <h2 className="mock-title">
          {t("Customization.settings.preview.title")}
        </h2>
        <p className="mock-description">
          {t("Customization.settings.preview.description")}
        </p>

        {/* Abstract shape representing content */}
        <div className="mock-content-shape" />
      </div>

      {/* Live Widget */}
      <div
        className="live-widget-button"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        style={{
          ...widgetStyle,
          ...positionStyles
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        }}
      >
        {data.widget.buttonText || "Analyze Skin"}
      </div>

      {/* Live Drawer */}
      <div
        className="live-drawer"
        style={{
          right: isDrawerOpen ? 0 : "-100%",
          backgroundColor: data.drawer.bgColor
        }}
      >
        {/* Header */}
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
          <span>{type === "skinCare" ? t("Customization.settings.preview.headerSkin") : t("Customization.settings.preview.headerHair")}</span>
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
          >
            ×
          </button>
        </div>

        {/* Content (Mock Bubbles) */}
        <div className="drawer-content">

          <div className="drawer-timeline">Today, 10:41 AM</div>

          <div
          className="chat-bubble"
            style={{
              backgroundColor: data.drawer.bubble.boat.bgColor,
              color: data.drawer.bubble.boat.textColor,
              fontSize: `${data.drawer.bubble.boat.fontSize}px`,
              fontWeight: data.drawer.bubble.boat.fontWeight,
              borderRadius: `${data.drawer.bubble.boat.radius}px`,
              borderBottomLeftRadius: "4px",
              width: typeof data.drawer.bubble.boat.width === 'number' ? `${data.drawer.bubble.boat.width}px` : data.drawer.bubble.boat.width,
              minHeight: `${data.drawer.bubble.boat.height}px`,
            }}
          >
            {t("Customization.settings.preview.mockMessage") || "Hello! We are here to help you find the best items for your regimen."}
          </div>

          <div
            style={{
              alignSelf: "flex-start",
              display: "grid",
              gap: "12px",
              width: "100%",
              marginTop: "4px",
            }}
          >


            {Object.keys(data.modules).length > 0 &&
              Object.entries(data.modules)
                .filter(([_, config]) => {
                  if (_ === "hairCare" && !data?.flags?.hairEnabled) return false
                  if (_ === "skinCare" && !data?.flags?.skinEnabled) return false
                  console.log("config.enabled:::", _, config, data)
                  return config.enabled
                })
                .map(([id, config]) => (
                  <div
                    key={id}
                    className="module-card"
                    style={{
                      border: `1px solid ${type === id ? "#2563eb" : "#e5e7eb"}`,
                    }}
                  >
                    {/* Dynamic Image Container */}
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

                    {/* Dynamic Text Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div
                        style={{
                          fontWeight: config.text.fontWeight,
                          color: config.text.textColor,
                          fontSize: `${config.text.fontSize}px`
                        }}
                      >
                        {config.text.label}
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          <div
            className="chat-bubble"
            style={{
              alignSelf: "flex-end",
              backgroundColor: data?.drawer?.bubble?.user.bgColor || "#ececec",
              color: data?.drawer?.bubble?.user.textColor || "#333",
              fontSize: `${data.drawer.bubble.user.fontSize}px`,
              fontWeight: data.drawer.bubble.user.fontWeight,
              borderRadius: `${data.drawer.bubble.user.radius}px`,
            }}
          >
            I would like to do a quick analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
