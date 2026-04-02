import { Card, TextField, Icon } from "@shopify/polaris";
import { SearchMinor, CancelMinor } from "@shopify/polaris-icons";

export default function ChatWidgetPanel({ open, onClose }) {

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        right: "24px",
        width: "360px",
        height: "550px",
        borderRadius: "20px",
        backgroundColor: "#fff",
        boxShadow: "0px 6px 20px rgba(0,0,0,0.25)",
        overflow: "hidden",
        zIndex: 10000,
        animation: "slideUp 0.3s ease-out"
      }}
    >

      {/* HEADER */}
      <div
        style={{
          backgroundColor: "#d9ffe2",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px"
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: "17px" }}>Hi there 👋</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>How can we help?</p>
        </div>

        {/* FIX: Wrap icon in clickable div */}
        <div
          onClick={onClose}
          style={{ cursor: "pointer", padding: "4px" }}
        >
          <Icon source={CancelMinor} color="critical" />
        </div>
      </div>

      {/* SEARCH BOX */}
      <div style={{ padding: "14px" }}>
        <TextField
          prefix={<Icon source={SearchMinor} />}
          placeholder="Search for help"
        />
      </div>

      {/* CONTENT */}
      <div style={{ padding: "14px" }}>
        <Card title="Popular Topics" sectioned>
          <ul style={{ fontSize: "14px", marginLeft: "-18px" }}>
            <li>How to install widgets?</li>
            <li>Fixing theme issues</li>
            <li>Troubleshooting setup</li>
          </ul>
        </Card>
      </div>

      {/* ANIMATION STYLES */}
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
