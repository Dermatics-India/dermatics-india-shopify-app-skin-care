import { useTranslation } from "react-i18next";
import { useCustomizeData } from "../../../hooks/useCustomizeData";

export function WidgetSettings({ data, onChange }) {
  const { t } = useTranslation();
  const { fontWeightOptions, widgetPositions } = useCustomizeData();

  const handleNumberChange = (field, value, min, max) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      onChange(field, min);
      return;
    }
    onChange(field, Math.max(min, Math.min(max, parsed)));
  };

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <s-select
        label={t("Customization.settings.widget.position")}
        value={data.widget.position}
        onChange={(e) => onChange("position", e.target.value)}
      >
        {widgetPositions.map((o) => (
          <s-option key={o.value} value={o.value}>{o.label}</s-option>
        ))}
      </s-select>

      <s-text-field
        label={t("Customization.settings.widget.buttonText")}
        value={data.widget.buttonText || ""}
        onInput={(e) => onChange("buttonText", e.target.value)}
        autocomplete="off"
      />

      <s-text-field
        label={t("Customization.settings.widget.fontSize")}
        type="number"
        min="10"
        max="36"
        value={String(data.widget.fontSize ?? 16)}
        onInput={(e) => handleNumberChange("fontSize", e.target.value, 0, 36)}
        autocomplete="off"
      />

      <s-select
        label={t("Customization.settings.widget.fontWeight")}
        value={data.widget.fontWeight}
        onChange={(e) => onChange("fontWeight", e.target.value)}
      >
        {fontWeightOptions.map((o) => (
          <s-option key={o.value} value={o.value}>{o.label}</s-option>
        ))}
      </s-select>

      <s-text-field
        label={t("Customization.settings.widget.paddingX")}
        type="number"
        min="10"
        max="60"
        value={String(data.widget.paddingX ?? 24)}
        onInput={(e) => handleNumberChange("paddingX", e.target.value, 0, 60)}
        autocomplete="off"
      />
      <s-text-field
        label={t("Customization.settings.widget.paddingY")}
        type="number"
        min="4"
        max="40"
        value={String(data.widget.paddingY ?? 12)}
        onInput={(e) => handleNumberChange("paddingY", e.target.value, 0, 40)}
        autocomplete="off"
      />
      <s-text-field
        label={t("Customization.settings.widget.radius")}
        type="number"
        min="0"
        max="50"
        value={String(data.widget.radius ?? 30)}
        onInput={(e) => handleNumberChange("radius", e.target.value, 0, 50)}
        autocomplete="off"
      />

      <s-color-field
        label={t("Customization.settings.widget.bgColor")}
        value={data.widget.bgColor}
        onChange={(e) => onChange("bgColor", e.target.value)}
      />
      <s-color-field
        label={t("Customization.settings.widget.textColor")}
        value={data.widget.textColor}
        onChange={(e) => onChange("textColor", e.target.value)}
      />
    </div>
  );
}
