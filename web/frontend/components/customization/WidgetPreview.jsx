import React from "react";
import { useTranslation } from "react-i18next";

export function WidgetPreview({ type, data, isDrawerOpen, setIsDrawerOpen }) {
  const { t } = useTranslation();

  function getWidgetStyles() {
    if (data.widget.displayType === "text") {
      return {
        backgroundColor: data.widget.bgColor,
        color: data.widget.textColor,
        fontSize: `${data.widget.fontSize}px`,
        fontWeight: data.widget.fontWeight,
        padding: `${data.widget.paddingY}px ${data.widget.paddingX}px`,
        borderRadius: `${data.widget.radius}px`,
      };
    }
    // Icon mode
    return {
      backgroundColor: data.widget.bgColor,
      color: data.widget.textColor,
      height: "60px",
      width: "60px",
      borderRadius: "50%",
    };
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
        backgroundColor: "#f4f6f8",
        overflow: "hidden",
        border: "none",
        borderRadius: "0 0 16px 16px",
      }}
    >
      {/* Mock Storefront */}
      <div style={{ padding: "60px 40px", color: "#202223", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "16px" }}>
          {t("Customization.settings.preview.title")}
        </h2>
        <p style={{ fontSize: "16px", color: "#6d7175", maxWidth: "400px", margin: "0 auto", lineHeight: "1.5" }}>
          {t("Customization.settings.preview.description")}
        </p>

        {/* Abstract shape representing content */}
        <div style={{
          marginTop: "40px",
          width: "100%",
          height: "200px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }} />
      </div>

      {/* Live Widget */}
      <div
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        style={{
          position: "absolute",
          bottom: "30px",
          right: "30px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          zIndex: 1000,
          ...getWidgetStyles(),
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
        {data.widget.displayType === "text" ? (
          data.widget.buttonText
        ) : (
          <span style={{ fontSize: "24px", color: "inherit" }}>✨</span>
        )}
      </div>

      {/* Live Drawer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: isDrawerOpen ? 0 : "-100%",
          width: "380px",
          maxWidth: "85%",
          height: "100%",
          backgroundColor: data.drawer.bgColor,
          boxShadow: "-4px 0 15px -3px rgba(0, 0, 0, 0.1)",
          transition: "right 0.3s ease-in-out",
          display: "flex",
          flexDirection: "column",
          zIndex: 999,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            backgroundColor: data.drawer.header.bg !== "#333333" ? data.drawer.header.bg : "transparent",
            color: data.drawer.header.color,
            fontFamily: data.drawer.header.font,
            fontSize: `${data.drawer.header.size}px`,
            fontWeight: "600",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e1e3e5"
          }}
        >
          <span>{type === "skincare" ? t("Customization.settings.preview.headerSkin") : t("Customization.settings.preview.headerHair")}</span>
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
        <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>

          <div style={{ textAlign: "center", color: "#6d7175", fontSize: "12px", marginBottom: "8px" }}>Today, 10:41 AM</div>

          <div
            style={{
              alignSelf: "flex-start",
              padding: "12px 16px",
              backgroundColor: data.drawer.bubble.bgColor,
              color: data.drawer.bubble.textColor,
              fontSize: `${data.drawer.bubble.fontSize}px`,
              fontWeight: data.drawer.bubble.fontWeight,
              borderRadius: `${data.drawer.bubble.radius}px`,
              borderBottomLeftRadius: "4px",
              width: typeof data.drawer.bubble.width === 'number' ? `${data.drawer.bubble.width}px` : data.drawer.bubble.width,
              minHeight: `${data.drawer.bubble.height}px`,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              lineHeight: "1.5"
            }}
          >
            {t("Customization.settings.preview.mockMessage") || "Hello! We are here to help you find the best items for your regimen."}
          </div>

          <div
            style={{
              alignSelf: "flex-end",
              padding: "12px 16px",
              backgroundColor: data?.drawer?.bubble?.bgColor || "#ececec",
              color: data?.drawer?.bubble?.textColor || "#333",
              fontSize: `${data.drawer.bubble.fontSize}px`,
              fontWeight: data.drawer.bubble.fontWeight,
              borderRadius: `${data.drawer.bubble.radius}px`,
              borderBottomRightRadius: "4px",
              maxWidth: "80%",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              lineHeight: "1.5",
              marginTop: "8px"
            }}
          >
            I would like to do a quick analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
