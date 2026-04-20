export function ProgressBar({ progress = 0, size = "medium", tone = "primary" }) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));
  const height = size === "small" ? "6px" : size === "large" ? "12px" : "8px";
  const fill =
    tone === "success"
      ? "var(--p-color-bg-fill-success, #29845a)"
      : tone === "critical"
      ? "var(--p-color-bg-fill-critical, #c52b2b)"
      : "var(--p-color-bg-fill-emphasis, #1a1a1a)";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: "100%",
        height,
        background: "var(--p-color-bg-surface-tertiary, #ebebeb)",
        borderRadius: "999px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: fill,
          borderRadius: "999px",
          transition: "width 240ms ease-in-out",
        }}
      />
    </div>
  );
}
