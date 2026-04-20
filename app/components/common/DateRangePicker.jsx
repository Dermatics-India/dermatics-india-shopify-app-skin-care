import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function getPresetRange(key) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return { start: d, end: d };
    }
    case "last7": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { start: d, end: today };
    }
    case "last15": {
      const d = new Date(today);
      d.setDate(d.getDate() - 14);
      return { start: d, end: today };
    }
    case "last30": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { start: d, end: today };
    }
    default:
      return null;
  }
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputValue(date) {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromInputValue(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function rangeToPickerValue(range) {
  if (!range?.start || !range?.end) return "";
  return `${toInputValue(range.start)}--${toInputValue(range.end)}`;
}

function pickerValueToRange(str) {
  if (!str || !str.includes("--")) return null;
  const [start, end] = str.split("--");
  return { start: fromInputValue(start), end: fromInputValue(end) };
}

function toViewValue(date) {
  const d = date || new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function DateRangePicker({ defaultPreset = "last30", onChange }) {
  const { t } = useTranslation();

  const defaultRange = getPresetRange(defaultPreset);
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
  const [dateRange, setDateRange] = useState(defaultRange);

  const committed = useRef({ preset: defaultPreset, range: defaultRange });
  const rootRef = useRef(null);

  const emitChange = useCallback(
    (preset, range) => {
      committed.current = { preset, range };
      if (onChange) onChange({ preset, ...range });
    },
    [onChange],
  );

  const closeAndRevert = useCallback(() => {
    const { preset, range } = committed.current;
    setSelectedPreset(preset);
    setDateRange(range);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) closeAndRevert();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, closeAndRevert]);

  const handlePresetSelect = (key) => {
    setSelectedPreset(key);
    if (key === "custom") return;
    const range = getPresetRange(key);
    setDateRange(range);
  };

  const handlePickerChange = (e) => {
    const next = pickerValueToRange(e.target.value);
    if (!next) return;
    setSelectedPreset("custom");
    setDateRange(next);
  };

  const handleApply = () => {
    if (!dateRange?.start || !dateRange?.end) return;
    emitChange(selectedPreset, dateRange);
    setOpen(false);
  };

  const buttonLabel = () => {
    if (selectedPreset && selectedPreset !== "custom") {
      return t(`cmn.dateFilter.${selectedPreset}`);
    }
    if (dateRange?.start && dateRange?.end) {
      return `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`;
    }
    return t("cmn.dateFilter.last30");
  };

  const presetOptions = [
    { value: "today", label: t("cmn.dateFilter.today") },
    { value: "yesterday", label: t("cmn.dateFilter.yesterday") },
    { value: "last7", label: t("cmn.dateFilter.last7") },
    { value: "last15", label: t("cmn.dateFilter.last15") },
    { value: "last30", label: t("cmn.dateFilter.last30") },
    { value: "custom", label: t("cmn.dateFilter.custom") },
  ];

  const pickerValue = rangeToPickerValue(dateRange);
  const viewValue = toViewValue(dateRange?.end || dateRange?.start);

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <s-button
        icon="calendar"
        disclosure
        onClick={() => setOpen((v) => !v)}
      >
        {buttonLabel()}
      </s-button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 40,
            background: "var(--p-color-bg-surface, #fff)",
            border: "1px solid var(--p-color-border, #e1e3e5)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "12px",
            minWidth: "450px",
          }}
        >
          <s-grid gridTemplateColumns="180px 1fr" gap="base">
            <s-stack direction="block" gap="none">
              {presetOptions.map((o) => {
                const active = selectedPreset === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handlePresetSelect(o.value)}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: active
                        ? "var(--p-color-bg-surface-selected, #ebebeb)"
                        : "transparent",
                      color: "var(--p-color-text, #111)",
                      fontWeight: active ? 600 : 500,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </s-stack>

            <s-stack direction="block" gap="base">
              <s-date-picker
                type="range"
                name="date-range"
                value={pickerValue}
                view={viewValue}
                onChange={handlePickerChange}
              />
              <s-stack direction="inline" justifyContent="end" gap="small-200">
                <s-button onClick={closeAndRevert}>
                  {t("cmn.dateFilter.cancel")}
                </s-button>
                <s-button variant="primary" onClick={handleApply}>
                  {t("cmn.dateFilter.apply")}
                </s-button>
              </s-stack>
            </s-stack>
          </s-grid>
        </div>
      )}
    </div>
  );
}
