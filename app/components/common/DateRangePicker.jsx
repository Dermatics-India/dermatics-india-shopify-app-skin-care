import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Compact range picker built on native <input type="date"> + a preset
// dropdown. Polaris web components don't ship a DatePicker/Popover pair, so
// we lean on the browser calendar and position a card below the trigger.

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

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setSelectedPreset(key);
    if (key === "custom") return;
    const range = getPresetRange(key);
    setDateRange(range);
    emitChange(key, range);
    setOpen(false);
  };

  const handleStart = (e) => {
    setSelectedPreset("custom");
    setDateRange((prev) => ({ ...prev, start: fromInputValue(e.target.value) }));
  };

  const handleEnd = (e) => {
    setSelectedPreset("custom");
    setDateRange((prev) => ({ ...prev, end: fromInputValue(e.target.value) }));
  };

  const handleApply = () => {
    if (!dateRange?.start || !dateRange?.end) return;
    emitChange("custom", dateRange);
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

  const maxDate = toInputValue(new Date());

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
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "16px",
            minWidth: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <s-select
            label={t("cmn.dateFilter.custom")}
            value={selectedPreset}
            onChange={handlePresetChange}
          >
            {presetOptions.map((o) => (
              <s-option key={o.value} value={o.value}>
                {o.label}
              </s-option>
            ))}
          </s-select>

          <div style={{ display: "flex", gap: "8px" }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px" }}>{t("cmn.dateFilter.from") || "From"}</span>
              <input
                type="date"
                value={toInputValue(dateRange?.start)}
                max={maxDate}
                onChange={handleStart}
              />
            </label>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "12px" }}>{t("cmn.dateFilter.to") || "To"}</span>
              <input
                type="date"
                value={toInputValue(dateRange?.end)}
                max={maxDate}
                onChange={handleEnd}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <s-button onClick={closeAndRevert}>
              {t("cmn.dateFilter.cancel")}
            </s-button>
            <s-button variant="primary" onClick={handleApply}>
              {t("cmn.dateFilter.apply")}
            </s-button>
          </div>
        </div>
      )}
    </div>
  );
}
