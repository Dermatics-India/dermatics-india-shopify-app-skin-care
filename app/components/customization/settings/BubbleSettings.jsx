import { useTranslation } from "react-i18next";
import { getClampedNumber, onKeyDownNumField } from "../../../utils";

const MARGIN_FIELDS = ["marginTop", "marginRight", "marginBottom", "marginLeft"];

function MarginGrid({ data, onChange, pathPrefix, t }) {
  return (
    <s-stack direction="block" gap="tight">
      <s-text>{t("Customization.settings.drawer.margin")}</s-text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {MARGIN_FIELDS.map((side) => (
          <s-number-field
            key={side}
            label={t(`Customization.settings.drawer.${side}`)}
            type="number"
            value={String(data?.[side] ?? 0)}
            onKeyDown={onKeyDownNumField}
            onInput={(e) =>
              onChange(
                [...pathPrefix, side],
                getClampedNumber(e.target.value, 0, 64),
              )
            }
            autocomplete="off"
          />
        ))}
      </div>
    </s-stack>
  );
}

function TextStyleGroup({ title, data, onChange, pathPrefix, fontWeightOptions, t }) {
  return (
    <s-stack direction="block" gap="base">
      <s-heading>{title}</s-heading>

      <s-number-field
        label={t("Customization.settings.drawer.fontSize")}
        type="number"
        value={String(data?.fontSize ?? 14)}
        onKeyDown={onKeyDownNumField}
        onInput={(e) =>
          onChange(
            [...pathPrefix, "fontSize"],
            getClampedNumber(e.target.value, 0, 32),
          )
        }
        autocomplete="off"
      />

      <s-select
        label={t("Customization.settings.drawer.fontWeight")}
        value={data?.fontWeight}
        onChange={(e) => onChange([...pathPrefix, "fontWeight"], e.target.value)}
      >
        {fontWeightOptions.map((o) => (
          <s-option key={o.value} value={o.value}>{o.label}</s-option>
        ))}
      </s-select>

      <s-color-field
        label={t("Customization.settings.drawer.textColor")}
        value={data?.color}
        onChange={(e) => onChange([...pathPrefix, "color"], e.target.value)}
      />

      <MarginGrid
        data={data}
        onChange={onChange}
        pathPrefix={pathPrefix}
        t={t}
      />
    </s-stack>
  );
}

export function BubbleSettings({ data, onChange, pathPrefix, fontWeightOptions }) {
  const { t } = useTranslation();

  const handleNumberChange = (field, value, min, max) => {
    onChange([...pathPrefix, field], getClampedNumber(value, min, max));
  };

  const handleValueChange = (field, val) => {
    onChange([...pathPrefix, field], val);
  };

  return (
    <s-stack direction="block" gap="loose">
      {/* Bubble card: background + radius */}
      <s-box padding="base">
        <s-stack direction="block" gap="base">
          <s-color-field
            label={t("Customization.settings.drawer.bubbleBg")}
            value={data.bgColor}
            onChange={(e) => handleValueChange("bgColor", e.target.value)}
          />
          <s-number-field
            label={t("Customization.settings.drawer.bubbleRadius")}
            type="number"
            value={String(data.radius ?? 12)}
            onKeyDown={onKeyDownNumField}
            onInput={(e) => handleNumberChange("radius", e.target.value, 0, 30)}
            autocomplete="off"
          />
        </s-stack>
      </s-box>
      <s-divider />

      <s-box padding="base">
        <TextStyleGroup
          title={t("Customization.settings.drawer.heading")}
          data={data.heading}
          onChange={onChange}
          pathPrefix={[...pathPrefix, "heading"]}
          fontWeightOptions={fontWeightOptions}
          t={t}
        />
      </s-box>

      <s-divider />

      <s-box padding="base">
        <TextStyleGroup
          title={t("Customization.settings.drawer.text")}
          data={data.text}
          onChange={onChange}
          pathPrefix={[...pathPrefix, "text"]}
          fontWeightOptions={fontWeightOptions}
          t={t}
        />
      </s-box>
    </s-stack>
  );
}
