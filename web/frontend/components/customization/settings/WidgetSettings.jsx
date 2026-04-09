import React from "react";
import { useTranslation } from 'react-i18next';
import { BlockStack, TextField, Select, Box } from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";

import { useCustomizeData } from "../../../hooks/useCustomizeData";

export function WidgetSettings({ data, onChange }) {
  const { t } = useTranslation()
  const { fontWeightOptions } = useCustomizeData()
  const handleNumberChange = (field, value, min, max) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      onChange(field, min);
      return;
    }

    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(field, clamped);
  };

  return (
    <Box padding="400">
      <BlockStack gap="400">
          <BlockStack gap="400">
            <TextField
              label={t("Customization.settings.widget.buttonText")}
              value={data.widget.buttonText}
              onChange={(val) => onChange("buttonText", val)}
              autoComplete="off"
            />
            <Select
              label={t("Customization.settings.widget.fontWeight")}
              options={fontWeightOptions}
              value={data.widget.fontWeight}
              onChange={(val) => onChange("fontWeight", val)}
            />
            <TextField
              label={t("Customization.settings.widget.fontSize")}
              type="number"
              min={10}
              max={36}
              value={String(data.widget.fontSize ?? 16)}
              onChange={(val) => handleNumberChange("fontSize", val, 10, 36)}
              autoComplete="off"
            />

            <TextField
              label={t("Customization.settings.widget.paddingX")}
              type="number"
              min={10}
              max={60}
              value={String(data.widget.paddingX ?? 24)}
              onChange={(val) => handleNumberChange("paddingX", val, 10, 60)}
              autoComplete="off"
            />
            <TextField
              label={t("Customization.settings.widget.paddingY")}
              type="number"
              min={4}
              max={40}
              value={String(data.widget.paddingY ?? 12)}
              onChange={(val) => handleNumberChange("paddingY", val, 4, 40)}
              autoComplete="off"
            />
            <TextField
              label={t("Customization.settings.widget.radius")}
              type="number"
              min={0}
              max={50}
              value={String(data.widget.radius ?? 30)}
              onChange={(val) => handleNumberChange("radius", val, 0, 50)}
              autoComplete="off"
            />
          </BlockStack>
        <ColorInput
          label={t("Customization.settings.widget.bgColor")}
          value={data.widget.bgColor}
          onChange={(val) => onChange("bgColor", val)}
        />
        <ColorInput
          label={t("Customization.settings.widget.textColor")}
          value={data.widget.textColor}
          onChange={(val) => onChange("textColor", val)}
        />
      </BlockStack>
    </Box>
  );
}
