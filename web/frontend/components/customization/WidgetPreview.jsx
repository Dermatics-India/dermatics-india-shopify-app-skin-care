import React from "react";
import { useTranslation } from "react-i18next";

export function WidgetPreview({ type, data, isDrawerOpen, setIsDrawerOpen }) {
  const { t } = useTranslation();

  const img_urls = {
    skinCare: "https://res.cloudinary.com/daqajshsm/image/upload/v1765433722/Group_okm1lm.jpg",
    hairCare: "https://res.cloudinary.com/daqajshsm/image/upload/v1765433778/Frame_dboqnw.jpg",
  }

  function getWidgetStyles() {
    return {
      backgroundColor: data.widget.bgColor,
      color: data.widget.textColor,
      fontSize: `${data.widget.fontSize}px`,
      fontWeight: data.widget.fontWeight,
      padding: `${data.widget.paddingY}px ${data.widget.paddingX}px`,
      borderRadius: `${data.widget.radius}px`,
    };
  }

  console.log("wiodget preview", data)

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
        {data.widget.buttonText || "Analyze Skin"}
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
            backgroundColor:
              data.drawer.header.bgColor !== "#333333"
                ? data.drawer.header.bgColor
                : "transparent",
            color: data.drawer.header.textColor,
            fontFamily: data.drawer.header.fontFamily,
            fontSize: `${data.drawer.header.fontSize}px`,
            fontWeight: "600",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e1e3e5"
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
        <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>

          <div style={{ textAlign: "center", color: "#6d7175", fontSize: "12px", marginBottom: "8px" }}>Today, 10:41 AM</div>

          <div
            style={{
              alignSelf: "flex-start",
              padding: "12px 16px",
              backgroundColor: data.drawer.bubble.boat.bgColor,
              color: data.drawer.bubble.boat.textColor,
              fontSize: `${data.drawer.bubble.boat.fontSize}px`,
              fontWeight: data.drawer.bubble.boat.fontWeight,
              borderRadius: `${data.drawer.bubble.boat.radius}px`,
              borderBottomLeftRadius: "4px",
              width: typeof data.drawer.bubble.boat.width === 'number' ? `${data.drawer.bubble.boat.width}px` : data.drawer.bubble.boat.width,
              minHeight: `${data.drawer.bubble.boat.height}px`,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              lineHeight: "1.5"
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
            {/* {[
              {
                id: "skinCare",
                title: "Skin Assessment",
                subtitle: "Analyze skin concerns and get routines",
                icon: img_urls.skin_assessment ,
              },
              {
                id: "hairCare",
                title: "Hair Assessment",
                subtitle: "Analyze hair concerns and get routines",
                icon: img_urls.hair_assessment,
              },
            ].map((item) => (
              <div
                key={item.id}
                style={{
                  borderRadius: "16px",
                  padding: "12px",
                  border: `1px solid ${type === item.id ? "#2563eb" : "#e5e7eb"}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    objectFit: "cover",
                  }}
                >
                  <img src={item.icon} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontWeight: 600, color: "#111827", fontSize: "14px" }}>{item.title}</div>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>{item.subtitle}</div>
                </div>
              </div>
            ))} */}

{ Object.keys(data.modules).length > 0 &&  
  Object.entries(data.modules)
  .filter(([_, config]) => config.enabled)
  .map(([id, config]) => (
    <div
      key={id}
      style={{
        borderRadius: "16px",
        padding: "12px",
        // Logic for selection border
        border: `1px solid ${type === id ? "#2563eb" : "#e5e7eb"}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "#fff",
        cursor: "pointer"
      }}
      onClick={() => setType(id)} // Assuming you want to select it
    >
      { console.log("dta----", id, config) }
      {/* Dynamic Image Container */}
      <div
        style={{
          width: `${config.image.width}px`,
          height: `${config.image.height}px`,
          borderRadius: `${config.image.radius}px`,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden", // Ensures image respects radius
        }}
      >
        <img 
          src={config.image.url || img_urls[`${id}`]} 
          alt={config.text.label} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
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
            style={{
              alignSelf: "flex-end",
              padding: "12px 16px",
              backgroundColor: data?.drawer?.bubble?.user.bgColor || "#ececec",
              color: data?.drawer?.bubble?.user.textColor || "#333",
              fontSize: `${data.drawer.bubble.user.fontSize}px`,
              fontWeight: data.drawer.bubble.user.fontWeight,
              borderRadius: `${data.drawer.bubble.user.radius}px`,
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
