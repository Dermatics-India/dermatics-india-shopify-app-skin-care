import React, { useState, useCallback, useRef } from "react";
import {
  Popover,
  Button,
  OptionList,
  DatePicker,
  Box,
  BlockStack,
  InlineStack,
  Text,
  Divider,
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
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

function DateRangePicker({ defaultPreset = "last30", onChange }) {
  const { t } = useTranslation();

  const defaultRange = getPresetRange(defaultPreset);
  const [popoverActive, setPopoverActive] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
  const [dateRange, setDateRange] = useState(defaultRange);
  const [calendarMonth, setCalendarMonth] = useState({
    month: defaultRange.start.getMonth(),
    year: defaultRange.start.getFullYear(),
  });

  // Store the committed state so cancel can revert
  const committedState = useRef({
    preset: defaultPreset,
    range: defaultRange,
  });

  const openPopover = useCallback(() => setPopoverActive(true), []);

  const closePopover = useCallback(() => setPopoverActive(false), []);

  const emitChange = useCallback(
    (preset, range) => {
      committedState.current = { preset, range };
      if (onChange) onChange({ preset, ...range });
    },
    [onChange]
  );

  const handleCancel = useCallback(() => {
    const { preset, range } = committedState.current;
    setSelectedPreset(preset);
    setDateRange(range);
    setCalendarMonth({
      month: range.start.getMonth(),
      year: range.start.getFullYear(),
    });
    setPopoverActive(false);
  }, []);

  const handlePresetChange = useCallback(
    (selected) => {
      const key = selected[0];
      setSelectedPreset(key);
      if (key === "custom") return;
      const range = getPresetRange(key);
      setDateRange(range);
      setCalendarMonth({
        month: range.start.getMonth(),
        year: range.start.getFullYear(),
      });
      emitChange(key, range);
      setPopoverActive(false);
    },
    [emitChange]
  );

  const handleCalendarChange = useCallback((range) => {
    setSelectedPreset("custom");
    setDateRange(range);
  }, []);

  const handleMonthChange = useCallback((month, year) => {
    setCalendarMonth({ month, year });
  }, []);

  const handleApply = useCallback(() => {
    emitChange("custom", dateRange);
    setPopoverActive(false);
  }, [emitChange, dateRange]);

  const getButtonLabel = () => {
    if (selectedPreset && selectedPreset !== "custom") {
      return t(`cmn.dateFilter.${selectedPreset}`);
    }
    if (dateRange.start && dateRange.end) {
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

  const activator = (
    <Button onClick={openPopover} icon={CalendarIcon} disclosure>
      {getButtonLabel()}
    </Button>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={handleCancel}
      preferredAlignment="right"
      autofocusTarget="none"
      fullHeight
    >
      <div style={{ display: "flex", width: "fit-content"}}>
        <div
          style={{
            // width: "160px",
            flexShrink: 0,
            borderRight: "1px solid var(--p-color-border)",
          }}
        >
          <Box paddingBlock="200">
            <OptionList
              options={presetOptions}
              selected={[selectedPreset]}
              onChange={handlePresetChange}
            />
          </Box>
        </div>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <Box padding="400">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                {/* <Text variant="headingSm" as="p">
                  {t("cmn.dateFilter.selectRange")}
                </Text> */}
                {selectedPreset === "custom" && dateRange.start && dateRange.end && (
                  <Text variant="bodySm" tone="subdued">
                    {formatDate(dateRange.start)} – {formatDate(dateRange.end)}
                  </Text>
                )}
              </InlineStack>
              <DatePicker
                month={calendarMonth.month}
                year={calendarMonth.year}
                onChange={handleCalendarChange}
                onMonthChange={handleMonthChange}
                selected={dateRange}
                allowRange
                disableDatesAfter={new Date()}
              />
              <Divider />
              <InlineStack align="end" gap="300">
                <Button size="slim" onClick={handleCancel}>
                  {t("cmn.dateFilter.cancel")}
                </Button>
                {selectedPreset === "custom" && dateRange.start && dateRange.end && (
                  <Button size="slim" variant="primary" onClick={handleApply}>
                    {t("cmn.dateFilter.apply")}
                  </Button>
                )}
              </InlineStack>
            </BlockStack>
          </Box>
        </div>
      </div>
    </Popover>
  );
}

export { DateRangePicker };
