import { useTranslation } from "react-i18next";
import { getClampedNumber } from "../../../utils";
import { ColorInput } from "../../common/ColorInput";

export function BubbleSettings({ data, onChange, pathPrefix, fontWeightOptions }) {
  const { t } = useTranslation();

  const handleNumberChange = (field, value, min, max) => {
    const val = getClampedNumber(value, min, max);
    onChange([...pathPrefix, field], val);
  };

  const handleValueChange = (field, val) => {
    onChange([...pathPrefix, field], val);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <ColorInput
        label={t("Customization.settings.drawer.bubbleBg")}
        value={data.bgColor}
        onChange={(val) => handleValueChange("bgColor", val)}
      />
      <ColorInput
        label={t("Customization.settings.drawer.bubbleColor")}
        value={data.textColor}
        onChange={(val) => handleValueChange("textColor", val)}
      />

      <s-text-field
        label={t("Customization.settings.drawer.fontSize")}
        type="number"
        value={String(data.fontSize ?? 14)}
        onInput={(e) => handleNumberChange("fontSize", e.target.value, 0, 24)}
        autocomplete="off"
      />

      <s-select
        label={t("Customization.settings.drawer.fontWeight")}
        value={data.fontWeight}
        onChange={(e) => handleValueChange("fontWeight", e.target.value)}
      >
        {fontWeightOptions.map((o) => (
          <s-option key={o.value} value={o.value}>{o.label}</s-option>
        ))}
      </s-select>

      <s-text-field
        label={t("Customization.settings.drawer.bubbleRadius")}
        type="number"
        value={String(data.radius ?? 12)}
        onInput={(e) => handleNumberChange("radius", e.target.value, 0, 30)}
        autocomplete="off"
      />
    </div>
  );
}
