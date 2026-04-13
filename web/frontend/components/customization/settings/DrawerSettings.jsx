import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next';
import { BlockStack, TextField, Select, Text, Divider, Box, Tabs } from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";
import { getClampedNumber } from '../../../utils';

// hooks 
import { useCustomizeData } from '../../../hooks/useCustomizeData';
import { BubbleSettings } from './BubbleSettings';

export const DrawerSettings = ({ data, onChange } ) => {
  const { t } = useTranslation()
  const { fontOptions, fontWeightOptions, bubbleTabs } = useCustomizeData()

  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelectedTab(selectedTabIndex),
    [],
  );

  const handleNumberChange = (path, value, min, max) => {
    const val = getClampedNumber(value, min, max)
    onChange(path, val);
  };

  console.log("data:::drawer settings", data)

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
            onChange={(val) => onChange(["bgColor"], val)}
          />
        </Box>
      </BlockStack>
      <Divider borderWidth="0165" />


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
              onChange={(val) => onChange(["header", "fontFamily"], val)}
            />
            <TextField
              label={t("Customization.settings.drawer.fontSize")}
              type="number"
              min={12}
              max={32}
              value={String(data.drawer.header.fontSize ?? 18)}
              onChange={(val) => handleNumberChange(["header", "fontSize"], val, 0, 32)}
              autoComplete="off"
            />

            <ColorInput
              label={t("Customization.settings.drawer.headerBg")}
              value={data.drawer.header.bgColor}
              onChange={(val) => onChange(["header", "bgColor"], val)}
            />
            <ColorInput
              label={t("Customization.settings.drawer.headerColor")}
              value={data.drawer.header.textColor}
              onChange={(val) => onChange(["header", "textColor"], val)}
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

        <Box padding={''}>
          <Tabs tabs={bubbleTabs} selected={selectedTab} onSelect={handleTabChange} />
          <Divider borderWidth='0165'/>
          <Box padding={"400"}>
          {selectedTab === 0 ? (
          <BubbleSettings
            fontWeightOptions={fontWeightOptions}
            data={data.drawer.bubble.boat} 
            pathPrefix={["bubble", "boat"]}
            onChange={onChange}
          />) : (
            <BubbleSettings
                fontWeightOptions={fontWeightOptions}
                data={data.drawer.bubble.user} 
                pathPrefix={["bubble", "user"]}
                onChange={onChange}
              />
          )}

          </Box>
        </Box>
      </BlockStack>
    </BlockStack>
  )
}

