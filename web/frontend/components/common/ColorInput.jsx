import { BlockStack, Text } from "@shopify/polaris";

// Helper component for Color input mimicking a branded layout
const ColorInput = ({ label, value, onChange }) => (
  <BlockStack gap="100">
    <Text as="p">{label}</Text>
    <div style={{ display: "flex", gap: "8px", alignItems: "stretch", height: "36px" }}>
      
      {/* Hex Text Wrapper */}
      <div 
        style={{
          flex: 1,
          backgroundColor: "#f8f8f8ff", 
          border: "1px solid #c9cccf",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          color: "#8c9196",
          fontSize: "14px",
          fontFamily: "monospace"
        }}
      >
        {value.toLowerCase()}
      </div>

      {/* Color Swatch / Input Wrapper */}
      <div 
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          borderRadius: "6px",
          border: "1px solid #c9cccf",
          overflow: "hidden",
          flexShrink: 0
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
            background: "transparent"
          }}
        />
      </div>
      
    </div>
  </BlockStack>
);

export { ColorInput };