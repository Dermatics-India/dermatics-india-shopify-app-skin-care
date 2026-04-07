import React from 'react'
import { useTranslation } from 'react-i18next';
import { BlockStack, InlineStack, TextField, Select, RangeSlider, Text, Divider, Tabs, Box, Grid, Card } from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";

// hooks 
import { useCustomizeData } from '../../../hooks/useCustomizeData';

export const DrawerSettings = ({ data, onChange } ) => {
    const { t } = useTranslation()
  const { fontOptions, fontWeightOptions } = useCustomizeData()
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
              value={data.drawer.header.font}
              onChange={(val) => onChange("header", "font", val)}
            />
            <RangeSlider
              label={t("Customization.settings.drawer.fontSize")}
              min={12}
              max={32}
              value={data.drawer.header.size}
              onChange={(val) => onChange("header", "size", val)}
              output
            />

            <ColorInput
              label={t("Customization.settings.drawer.headerBg")}
              value={data.drawer.header.bg}
              onChange={(val) => onChange("header", "bg", val)}
            />
            <ColorInput
              label={t("Customization.settings.drawer.headerColor")}
              value={data.drawer.header.color}
              onChange={(val) => onChange("header", "color", val)}
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
            <RangeSlider
              label={t("Customization.settings.drawer.fontSize")}
              min={10}
              max={24}
              value={data.drawer.bubble.fontSize}
              onChange={(val) => onChange("bubble", "fontSize", val)}
              output
            />
            <Select
              label={t("Customization.settings.drawer.fontWeight")}
              options={fontWeightOptions}
              value={data.drawer.bubble.fontWeight}
              onChange={(val) => onChange("bubble", "fontWeight", val)}
            />
            <RangeSlider
              label={t("Customization.settings.drawer.bubbleRadius")}
              min={0}
              max={30}
              value={data.drawer.bubble.radius}
              onChange={(val) => onChange("bubble", "radius", val)}
              output
            />
          </BlockStack>
        </Box>
      </BlockStack>
    </BlockStack>
  )
}

