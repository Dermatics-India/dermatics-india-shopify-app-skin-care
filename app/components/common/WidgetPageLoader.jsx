import { useTranslation } from "react-i18next";

// Skeleton shell shown while the customization pages load. Polaris web
// components don't offer skeletons yet, so this renders shimmer blocks via
// plain CSS inside s-page/s-section.
export function WidgetPageLoader() {
  const { t } = useTranslation();

  return (
    <s-page heading={t("cmn.loading")}>
      <s-grid gridTemplateColumns="1fr 2fr" gap="base">
        <s-section>
          <SkeletonBlock lines={10} />
        </s-section>
        <s-section>
          <SkeletonBlock lines={15} minHeight="600px" />
        </s-section>
      </s-grid>
    </s-page>
  );
}

function SkeletonBlock({ lines = 6, minHeight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "12px",
            width: `${60 + ((i * 7) % 35)}%`,
            borderRadius: "4px",
            background:
              "linear-gradient(90deg, #eceff1 0%, #f5f7f8 50%, #eceff1 100%)",
            backgroundSize: "200% 100%",
            animation: "skeencare-shimmer 1.4s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`@keyframes skeencare-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
