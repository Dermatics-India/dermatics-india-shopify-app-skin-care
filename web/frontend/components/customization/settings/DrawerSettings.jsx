import React from 'react'
import { useTranslation } from 'react-i18next';
import { BlockStack, TextField, Select, Text, Divider, Box } from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";

// hooks 
import { useCustomizeData } from '../../../hooks/useCustomizeData';

export const DrawerSettings = ({ data, onChange } ) => {
  const { t } = useTranslation()
  const { fontOptions, fontWeightOptions } = useCustomizeData()
  const handleNumberChange = (section, field, value, min, max) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      onChange(section, field, min);
      return;
    }

    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(section, field, clamped);
  };

  return (
    <BlockStack gap="">
      <BlockStack>
        <Box padding={'400'}>
          <Text variant="headingMd" as="h3">{t("Customization.settings.drawer.general")}</Text>
        </Box>
        <Divider borderWidth="0165" />
        <Box padding={'400'}>
          <ColorInput
            label={t("Customization.settings.drawer.drawerBg")}
            value={data.drawer.bgColor}
            onChange={(val) => onChange(null, "bgColor", val)}
          />
        </Box>
      </BlockStack>
      <Divider borderWidth="050" />


      {/* <Card padding="400"> */}
      <BlockStack
      // gap="400"
      >
        <Box padding={'400'}>
          <Text variant="headingMd" as="h3">{t("Customization.settings.drawer.header")}</Text>
        </Box>
        <Divider />
        <Box padding={'400'}>
          <BlockStack gap="400">

            <Select
              label={t("Customization.settings.drawer.fontFamily")}
              options={fontOptions}
              value={data.drawer.header.fontFamily}
              onChange={(val) => onChange("header", "fontFamily", val)}
            />
            <TextField
              label={t("Customization.settings.drawer.fontSize")}
              type="number"
              min={12}
              max={32}
              value={String(data.drawer.header.fontSize ?? 18)}
              onChange={(val) => handleNumberChange("header", "fontSize", val, 12, 32)}
              autoComplete="off"
            />

            <ColorInput
              label={t("Customization.settings.drawer.headerBg")}
              value={data.drawer.header.bgColor}
              onChange={(val) => onChange("header", "bgColor", val)}
            />
            <ColorInput
              label={t("Customization.settings.drawer.headerColor")}
              value={data.drawer.header.textColor}
              onChange={(val) => onChange("header", "textColor", val)}
            />
          </BlockStack>
        </Box>
      </BlockStack>
      {/* </Card> */}

      <Divider />

      <BlockStack>
        <Box padding={'400'}>
          <Text variant="headingMd" as="h3">{t("Customization.settings.drawer.bubbles")}</Text>
        </Box>
        <Divider />
        <Box padding={'400'}>
          <BlockStack gap="400">
            <ColorInput
              label={t("Customization.settings.drawer.bubbleBg")}
              value={data.drawer.bubble.bgColor}
              onChange={(val) => onChange("bubble", "bgColor", val)}
            />
            <ColorInput
              label={t("Customization.settings.drawer.bubbleColor")}
              value={data.drawer.bubble.textColor}
              onChange={(val) => onChange("bubble", "textColor", val)}
            />
            <TextField
              label={t("Customization.settings.drawer.fontSize")}
              type="number"
              min={10}
              max={24}
              value={String(data.drawer.bubble.fontSize ?? 14)}
              onChange={(val) => handleNumberChange("bubble", "fontSize", val, 10, 24)}
              autoComplete="off"
            />
            <Select
              label={t("Customization.settings.drawer.fontWeight")}
              options={fontWeightOptions}
              value={data.drawer.bubble.fontWeight}
              onChange={(val) => onChange("bubble", "fontWeight", val)}
            />
            <TextField
              label={t("Customization.settings.drawer.bubbleRadius")}
              type="number"
              min={0}
              max={30}
              value={String(data.drawer.bubble.radius ?? 12)}
              onChange={(val) => handleNumberChange("bubble", "radius", val, 0, 30)}
              autoComplete="off"
            />
          </BlockStack>
        </Box>
      </BlockStack>
    </BlockStack>
  )
}

