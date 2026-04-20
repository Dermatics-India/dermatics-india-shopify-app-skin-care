// Category tile on the customization landing page. Wraps Polaris web
// component primitives so the greyed-out state on locked features still reads
// visually like the Node app.
export function CategoryCard({ title, description, buttonText, image, onAction, disabled }) {
  return (
    <s-section>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {image && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              opacity: disabled ? 0.5 : 1,
              filter: disabled ? "grayscale(100%)" : "none",
            }}
          >
            <img src={image} alt={title} width={120} style={{ display: "block" }} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <s-heading tone={disabled ? "disabled" : undefined}>{title}</s-heading>
          <s-paragraph tone={disabled ? "disabled" : "subdued"}>{description}</s-paragraph>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <s-button onClick={onAction} disabled={disabled || undefined}>
            {buttonText}
          </s-button>
        </div>
      </div>
    </s-section>
  );
}
