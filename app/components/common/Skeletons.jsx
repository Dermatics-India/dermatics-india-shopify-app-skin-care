const SHIMMER_KEYFRAMES = `@keyframes skeencare-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;

const shimmerStyle = {
  background:
    "linear-gradient(90deg, #eceff1 0%, #f5f7f8 50%, #eceff1 100%)",
  backgroundSize: "200% 100%",
  animation: "skeencare-shimmer 1.4s ease-in-out infinite",
};

export function ShimmerKeyframes() {
  return <style>{SHIMMER_KEYFRAMES}</style>;
}

export function SkeletonBar({ width = "100%", height = "12px", radius = "4px" }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        ...shimmerStyle,
      }}
    />
  );
}

export function SkeletonBlock({ lines = 6, minHeight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBar width={`${60 + ((i * 7) % 35)}%`} key={i} />
      ))}
      <ShimmerKeyframes />
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <SkeletonBar width="40%" height="20px" />
          <SkeletonBar width="56px" height="20px" radius="999px" />
        </s-stack>

        <s-stack direction="inline" alignItems="baseline" gap="small-200">
          <SkeletonBar width="72px" height="28px" />
          <SkeletonBar width="56px" height="12px" />
        </s-stack>

        <SkeletonBar width="96px" height="20px" radius="999px" />

        <s-stack direction="block" gap="small-200">
          <SkeletonBar width="90%" />
          <SkeletonBar width="78%" />
          <SkeletonBar width="84%" />
          <SkeletonBar width="66%" />
        </s-stack>

        <SkeletonBar width="100%" height="36px" radius="8px" />
      </s-stack>
    </s-section>
  );
}

export function PlanSkeletonGrid() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" alignItems="center" gap="small-200">
        <SkeletonBar width="220px" height="24px" />
        <SkeletonBar width="320px" height="14px" />
      </s-stack>

      <s-section>
        <s-stack direction="block" gap="small-300">
          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
            <SkeletonBar width="180px" height="18px" />
            <SkeletonBar width="96px" height="20px" radius="999px" />
          </s-stack>
          <SkeletonBar width="100%" height="6px" radius="999px" />
          <SkeletonBar width="160px" height="12px" />
        </s-stack>
      </s-section>

      <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
        {[0, 1, 2, 3].map((i) => (
          <PlanCardSkeleton key={i} />
        ))}
      </s-grid>

      <ShimmerKeyframes />
    </s-stack>
  );
}
