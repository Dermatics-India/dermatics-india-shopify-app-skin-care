import React from 'react';
import { BlockStack, TextField, Select } from '@shopify/polaris'; // Assuming Polaris based on component names
import { useTranslation } from 'react-i18next';
import { getClampedNumber } from '../../../utils';
import { ColorInput } from '../../common';

export const BubbleSettings = ({ data, onChange, pathPrefix, fontWeightOptions }) => {
    const { t } = useTranslation()
  // Path prefix would be something like ["bubble", "boat"] or ["bubble", "user"]

  const handleNumberChange = (field, value, min, max) => {
    const val = getClampedNumber(value, min, max);
    // Spreads pathPrefix (e.g., ["bubble", "boat"]) and adds the field (e.g., "fontSize")
    onChange([...pathPrefix, field], val);
  };

  const handleValueChange = (field, val) => {
    onChange([...pathPrefix, field], val);
  };

  return (
    <BlockStack gap="400">
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

      <TextField
        label={t("Customization.settings.drawer.fontSize")}
        type="number"
        value={String(data.fontSize ?? 14)}
        onChange={(val) => handleNumberChange("fontSize", val, 10, 24)}
        autoComplete="off"
      />

      <Select
        label={t("Customization.settings.drawer.fontWeight")}
        options={fontWeightOptions}
        value={data.fontWeight}
        onChange={(val) => handleValueChange("fontWeight", val)}
      />

      <TextField
        label={t("Customization.settings.drawer.bubbleRadius")}
        type="number"
        value={String(data.radius ?? 12)}
        onChange={(val) => handleNumberChange("radius", val, 0, 30)}
        autoComplete="off"
      />
    </BlockStack>
  );
};