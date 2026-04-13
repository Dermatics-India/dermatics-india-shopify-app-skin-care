import React from "react";
import {
  BlockStack,
  TextField,
  Checkbox,
  Box,
  DropZone,
  Select,
  InlineStack,
  Text,
  Spinner,
  Divider,
  Button
} from "@shopify/polaris";
import { ColorInput } from "../../common/ColorInput";
import { useCustomizeData } from "../../../hooks/useCustomizeData";
import { t } from "i18next";

export function ModuleSettings({ data, onChange, onImageUpload, isImageUploading }) {

  const { fontWeightOptions } = useCustomizeData()

  const handleNumberChange = (field, value, min, max, section = "text") => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      onChange([section, field], min);
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange([section, field], clamped);
  };

  return (
    <Box padding="0">
      <Box padding="400">
        <Checkbox
          label="Enabled"
          checked={!!data.enabled}
          onChange={(val) => onChange(["enabled"], val)}
        />
      </Box>
      <Divider borderWidth="0165" />
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd">Image</Text>
          <BlockStack gap="200">
            {/* 1. Show Image Preview if URL exists */}
            {data?.image?.url ? (
              <BlockStack gap={"200"}>
                <div className="drop-zone-image-preview-container">
                  <img
                    src={data.image.url}
                    alt="Preview"
                    className="object-fit-cover"
                  />
                </div>

                <InlineStack wrap={false}>
                  <Button
                    fullWidth={false}
                    onClick={() => onChange(["image", "url"], "")}
                  >
                    { t("cmn.change") }
                  </Button>
                </InlineStack>

              </BlockStack>
            ) : (
              /* 3. Show DropZone only if NO image is uploaded */
              <DropZone
                allowMultiple={false}
                accept="image/*"
                disabled={isImageUploading}
                onDrop={(_, acceptedFiles) => {
                  if (acceptedFiles?.[0]) {
                    onImageUpload(acceptedFiles[0]);
                  }
                }}
              >
                <DropZone.FileUpload actionTitle="Upload image" />
              </DropZone>
            )}

            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodySm" tone={"subdued"}>
                {data?.image?.url ? "Image uploaded successfully" : "No image uploaded"}
              </Text>
              {isImageUploading ? (
                <Spinner accessibilityLabel="Uploading image" size="small" />
              ) : null}
            </InlineStack>
          </BlockStack>
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
      <Divider borderWidth="0165" />
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd">Label</Text>
          <TextField
            label="Label"
            value={data?.text?.label || ""}
            onChange={(val) => onChange(["text", "label"], val)}
            autoComplete="off"
          />
          <ColorInput
            label="Text Color"
            value={data?.text?.textColor || "#333333"}
            onChange={(val) => onChange(["text", "textColor"], val)}
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
          <Select
            label="Font Weight"
            options={fontWeightOptions}
            value={String(data?.text?.fontWeight || "normal")}
            onChange={(val) => onChange(["text", "fontWeight"], val)}
          />
        </BlockStack>
      </Box>
    </Box>
  );
}
