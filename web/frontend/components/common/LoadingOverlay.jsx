import React from "react";
import { Box, Spinner } from "@shopify/polaris";

/**
 * LoadingOverlay Component
 * @param {boolean} active - Whether the loading state is active
 * @param {boolean} blur - Whether to apply the blur effect (default: true)
 * @param {React.ReactNode} children - The content to be blurred/disabled
 */
export const LoadingOverlay = ({ active, blur = true, children }) => {
  return (
    <div style={{ position: "relative" }}>
      {/* 1. The Spinner Overlay */}
      {active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 100, // Ensure it's above everything
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.4)",
            borderRadius: "var(--p-border-radius-200)", // Match Polaris cards
          }}
        >
          <Spinner accessibilityLabel="Loading" size="large" />
        </div>
      )}

      {/* 2. The Content Wrapper */}
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
};