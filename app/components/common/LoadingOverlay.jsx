// Generic overlay that blurs children while async work is in-flight.
// Uses Polaris' spinner web component so the style matches the admin shell.
export function LoadingOverlay({ active, blur = true, children }) {
  return (
    <div style={{ position: "relative" }}>
      {active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.4)",
            borderRadius: "var(--p-border-radius-200)",
          }}
        >
          <s-spinner accessibilityLabel="Loading" size="large" />
        </div>
      )}
      <div
        style={{
          filter: active && blur ? "blur(4px)" : "none",
          pointerEvents: active ? "none" : "auto",
          userSelect: active ? "none" : "auto",
          transition: "filter 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
