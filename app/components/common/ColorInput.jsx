// Branded hex + color-swatch input. Polaris web components don't ship a
// colour picker, so this stays as plain HTML to match the Node app visuals.
export function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <p style={{ margin: 0, fontSize: "13px" }}>{label}</p>
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch", height: "36px" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: "#f8f8f8",
            border: "1px solid #c9cccf",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            color: "#8c9196",
            fontSize: "14px",
            fontFamily: "monospace",
          }}
        >
          {(value || "").toLowerCase()}
        </div>
        <div
          style={{
            position: "relative",
            width: "36px",
            height: "36px",
            borderRadius: "6px",
            border: "1px solid #c9cccf",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute",
              top: "-10px",
              left: "-10px",
              width: "56px",
              height: "56px",
              padding: 0,
              border: "none",
              cursor: "pointer",
              background: "transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
}
