import { Icon } from "@shopify/polaris";
import { ChatMajor } from "@shopify/polaris-icons";

export default function FloatingChatButton({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "55px",
        height: "55px",
        borderRadius: "50%",
        backgroundColor: "#1f1f1f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
        zIndex: 9999
      }}
    >
      <Icon source={ChatMajor} color="base" />
    </div>
  );
}
