import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getClampedNumber, onKeyDownNumField } from "../../../utils";
import { useCustomizeData } from "../../../hooks/useCustomizeData";
import { BubbleSettings } from "./BubbleSettings";

function SectionHeader({ title }) {
  return (
    <div style={{ padding: "16px" }}>
      <s-heading>{title}</s-heading>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid var(--p-color-text, #111)" : "2px solid transparent",
        padding: "10px 16px",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--p-color-text, #111)" : "var(--p-color-text-subdued, #6d7175)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function DrawerSettings({ data, onChange }) {
  const { t } = useTranslation();
  const { fontOptions, fontWeightOptions, bubbleTabs } = useCustomizeData();

  const [selectedTab, setSelectedTab] = useState(0);

  const handleNumberChange = (path, value, min, max) => {
    onChange(path, getClampedNumber(value, min, max));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionHeader title={t("Customization.settings.drawer.general")} />
      <s-divider />
      <div style={{ padding: "16px" }}>
        <s-color-field
          label={t("Customization.settings.drawer.drawerBg")}
          value={data.drawer.bgColor}
          onChange={(e) => onChange(["bgColor"], e.target.value)}
        />
      </div>

      <s-divider />
      <SectionHeader title={t("Customization.settings.drawer.header")} />
      <s-divider />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <s-select
          label={t("Customization.settings.drawer.fontFamily")}
          value={data.drawer.header.fontFamily}
          onChange={(e) => onChange(["header", "fontFamily"], e.target.value)}
        >
          {fontOptions.map((o) => (
            <s-option key={o.value} value={o.value}>{o.label}</s-option>
          ))}
        </s-select>

        <s-number-field
          label={t("Customization.settings.drawer.fontSize")}
          type="number"
          min="12"
          max="32"
          value={String(data.drawer.header.fontSize ?? 18)}
          onKeyDown={onKeyDownNumField}
          onInput={(e) => handleNumberChange(["header", "fontSize"], e.target.value, 0, 32)}
          autocomplete="off"
        />

        <s-color-field
          label={t("Customization.settings.drawer.headerBg")}
          value={data.drawer.header.bgColor}
          onChange={(e) => onChange(["header", "bgColor"], e.target.value)}
        />
        <s-color-field
          label={t("Customization.settings.drawer.headerColor")}
          value={data.drawer.header.textColor}
          onChange={(e) => onChange(["header", "textColor"], e.target.value)}
        />
      </div>

      <s-divider />
      <SectionHeader title={t("Customization.settings.drawer.bubbles")} />
      <s-divider />

      <div style={{ display: "flex", borderBottom: "1px solid var(--p-color-border, #e1e3e5)" }}>
        {bubbleTabs.map((tab, i) => (
          <TabButton key={tab.id} active={selectedTab === i} onClick={() => setSelectedTab(i)}>
            {tab.content}
          </TabButton>
        ))}
      </div>

        {selectedTab === 0 ? (
          <BubbleSettings
            fontWeightOptions={fontWeightOptions}
            data={data.drawer.bubble.boat}
            pathPrefix={["bubble", "boat"]}
            onChange={onChange}
          />
        ) : (
          <BubbleSettings
            fontWeightOptions={fontWeightOptions}
            data={data.drawer.bubble.user}
            pathPrefix={["bubble", "user"]}
            onChange={onChange}
          />
        )}
      </div>
  );
}
