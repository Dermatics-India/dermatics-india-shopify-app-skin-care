import React from "react";
import { BlockStack, TextField, Checkbox, Box } from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";

export function ModuleSettings({ data, onChange }) {
  const handleNumberChange = (field, value, min, max, section = "text") => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      onChange(section, field, min);
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(section, field, clamped);
  };

  return (
    <Box padding="400">
      <BlockStack gap="400">
        <Checkbox
          label="Enabled"
          checked={!!data.enabled}
          onChange={(val) => onChange(null, "enabled", val)}
        />

        <TextField
          label="Label"
          value={data?.text?.label || ""}
          onChange={(val) => onChange("text", "label", val)}
          autoComplete="off"
        />
        <ColorInput
          label="Text Color"
          value={data?.text?.textColor || "#333333"}
          onChange={(val) => onChange("text", "textColor", val)}
        />
        <TextField
          label="Text Size"
          type="number"
          min={10}
          max={48}
          value={String(data?.text?.fontSize ?? 14)}
          onChange={(val) => handleNumberChange("fontSize", val, 0, 48, "text")}
          autoComplete="off"
        />
        <TextField
          label="Image URL"
          value={data?.image?.url || ""}
          onChange={(val) => onChange("image", "url", val)}
          autoComplete="off"
        />
        <TextField
          label="Image Height"
          type="number"
          min={20}
          max={300}
          value={String(data?.image?.height ?? 50)}
          onChange={(val) => handleNumberChange("height", val, 0, 400, "image")}
          autoComplete="off"
        />
        <TextField
          label="Image Width"
          type="number"
          min={20}
          max={300}
          value={String(data?.image?.width ?? 50)}
          onChange={(val) => handleNumberChange("width", val, 0, 400, "image")}
          autoComplete="off"
        />
        <TextField
          label="Image Radius"
          type="number"
          min={0}
          max={100}
          value={String(data?.image?.radius ?? 15)}
          onChange={(val) => handleNumberChange("radius", val, 0, 100, "image")}
          autoComplete="off"
        />
      </BlockStack>
    </Box>
  );
}
