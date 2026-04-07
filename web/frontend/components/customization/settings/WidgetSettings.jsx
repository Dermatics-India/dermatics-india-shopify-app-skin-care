import React, { useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { BlockStack, InlineStack, TextField, Select, RangeSlider, Text, Divider, Tabs, Box, Grid, Card } from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";

import { useCustomizeData } from "../../../hooks/useCustomizeData";

export function WidgetSettings({ data, onChange }) {
  const { t } = useTranslation()
  const { fontWeightOptions, displayTypeOptions } = useCustomizeData()

  return (
    <Box padding="400">
      <BlockStack gap="400">
        <Select
          label={t("Customization.settings.widget.displayType")}
          options={displayTypeOptions}
          value={data.widget.displayType}
          onChange={(val) => onChange("displayType", val)}
        />

        {data.widget.displayType === "icon" && (
          <TextField
            label={t("Customization.settings.widget.iconUrl")}
            placeholder="https://..."
            value={data.widget.iconUrl}
            onChange={(val) => onChange("iconUrl", val)}
            autoComplete="off"
            helpText={t("Customization.settings.widget.iconUrlHelp")}
          />
        )}

        {data.widget.displayType === "text" && (
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
            <RangeSlider
              label={t("Customization.settings.widget.fontSize")}
              min={10}
              max={36}
              value={data.widget.fontSize}
              onChange={(val) => onChange("fontSize", val)}
              output
            />

            <RangeSlider
              label={t("Customization.settings.widget.paddingX")}
              min={10}
              max={60}
              value={data.widget.paddingX}
              onChange={(val) => onChange("paddingX", val)}
              output
            />
            <RangeSlider
              label={t("Customization.settings.widget.paddingY")}
              min={4}
              max={40}
              value={data.widget.paddingY}
              onChange={(val) => onChange("paddingY", val)}
              output
            />
            <RangeSlider
              label={t("Customization.settings.widget.radius")}
              min={0}
              max={50}
              value={data.widget.radius}
              onChange={(val) => onChange("radius", val)}
              output
            />
          </BlockStack>
        )}
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
