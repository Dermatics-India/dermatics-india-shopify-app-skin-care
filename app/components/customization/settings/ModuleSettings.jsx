import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCustomizeData } from "../../../hooks/useCustomizeData";
import { getClampedNumber, onKeyDownNumField } from "~/utils";

export function ModuleSettings({ data, onChange, onImageUpload, isImageUploading }) {
  const { t } = useTranslation();
  const { fontWeightOptions } = useCustomizeData();
  const fileInputRef = useRef(null);

  const handleNumberChange = (field, value, min, max, section = "text") => {
    const val = getClampedNumber(value, min, max)
    onChange([section, field], val);
  };

  const triggerFilePick = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    if (isImageUploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) onImageUpload(file);
  };

  const handlePickChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ padding: "16px" }}>
        <s-checkbox
          label="Enabled"
          checked={!!data.enabled || undefined}
          onChange={(e) => onChange(["enabled"], e.target.checked)}
        />
      </div>
      <s-divider />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <s-heading>Image</s-heading>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data?.image?.url ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="drop-zone-image-preview-container">
                <img src={data.image.url} alt="Preview" className="object-fit-cover" />
              </div>
              <div>
                <s-button onClick={() => onChange(["image", "url"], "")}>
                  {t("cmn.change")}
                </s-button>
              </div>
            </div>
          ) : (
            <div
              onClick={triggerFilePick}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: "2px dashed var(--p-color-border, #babfc3)",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                cursor: isImageUploading ? "progress" : "pointer",
                background: "var(--p-color-bg-surface-secondary, #f6f6f7)",
                opacity: isImageUploading ? 0.6 : 1,
              }}
            >
              <s-paragraph tone="subdued">Upload image</s-paragraph>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickChange}
                style={{ display: "none" }}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <s-text tone="subdued">
              {data?.image?.url ? "Image uploaded successfully" : "No image uploaded"}
            </s-text>
            {isImageUploading && <s-spinner size="small" accessibilityLabel="Uploading image" />}
          </div>
        </div>

        <s-number-field
          label="Image Height"
          type="number"
          min="20"
          max="300"
          value={String(data?.image?.height ?? 50)}
          onKeyDown={onKeyDownNumField}
          onInput={(e) => handleNumberChange("height", e.target.value, 0, 400, "image")}
          autocomplete="off"
        />
        <s-number-field
          label="Image Width"
          type="number"
          min="20"
          max="300"
          value={String(data?.image?.width ?? 50)}
          onKeyDown={onKeyDownNumField}
          onInput={(e) => handleNumberChange("width", e.target.value, 0, 400, "image")}
          autocomplete="off"
        />
        <s-number-field
          label="Image Radius"
          type="number"
          min="0"
          max="100"
          value={String(data?.image?.radius ?? 15)}
          onKeyDown={onKeyDownNumField}
          onInput={(e) => handleNumberChange("radius", e.target.value, 0, 100, "image")}
          autocomplete="off"
        />
      </div>

      <s-divider />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <s-heading>Label</s-heading>
        <s-text-field
          label="Label"
          value={data?.text?.label || ""}
          onInput={(e) => onChange(["text", "label"], e.target.value)}
          autocomplete="off"
        />
        <s-color-field
          label="Text Color"
          value={data?.text?.textColor || "#333333"}
          onChange={(e) => onChange(["text", "textColor"], e.target.value)}
        />
        <s-number-field
          label="Text Size"
          type="number"
          min="10"
          max="48"
          value={String(data?.text?.fontSize ?? 14)}
          onKeyDown={onKeyDownNumField}
          onInput={(e) => handleNumberChange("fontSize", e.target.value, 0, 48, "text")}
          autocomplete="off"
        />
        <s-select
          label="Font Weight"
          value={String(data?.text?.fontWeight || "normal")}
          onChange={(e) => onChange(["text", "fontWeight"], e.target.value)}
        >
          {fontWeightOptions.map((o) => (
            <s-option key={o.value} value={o.value}>{o.label}</s-option>
          ))}
        </s-select>
      </div>
    </div>
  );
}
