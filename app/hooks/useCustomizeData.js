import { useTranslation } from "react-i18next";

export const useCustomizeData = () => {
  const { t } = useTranslation();

  const tabs = [
    { id: "widget-settings", content: t("Customization.settings.tabs.widget"), panelID: "widget" },
    { id: "drawer-settings", content: t("Customization.settings.tabs.drawer"), panelID: "drawer" },
  ];

  const fontWeightOptions = [
    { label: "Normal", value: "normal" },
    { label: "Bold", value: "bold" },
    { label: "100", value: "100" },
    { label: "200", value: "200" },
    { label: "300", value: "300" },
    { label: "400", value: "400" },
    { label: "500", value: "500" },
    { label: "600", value: "600" },
    { label: "700", value: "700" },
    { label: "800", value: "800" },
    { label: "900", value: "900" },
  ];

  const fontOptions = [
    { label: t("cmn.sansSerif"), value: "sans-serif" },
    { label: t("cmn.serif"), value: "serif" },
    { label: t("cmn.monospace"), value: "monospace" },
  ];

  const bubbleTabs = [
    {
      id: "boat-bubble",
      content: t("Customization.settings.drawer.boat"),
      accessibilityLabel: "Boat bubble settings",
      panelID: "boat-bubble-panel",
    },
    {
      id: "user-bubble",
      content: t("Customization.settings.drawer.user"),
      accessibilityLabel: "User bubble settings",
      panelID: "user-bubble-panel",
    },
  ];

  const widgetPositions = [
    { label: t("cmn.positions.bottomRight"), value: "bottom-right" },
    { label: t("cmn.positions.bottomLeft"), value: "bottom-left" },
    { label: t("cmn.positions.bottomCenter"), value: "bottom-center" },
    { label: t("cmn.positions.topRight"), value: "top-right" },
    { label: t("cmn.positions.topLeft"), value: "top-left" },
    { label: t("cmn.positions.topCenter"), value: "top-center" },
    { label: t("cmn.positions.middleRight"), value: "middle-right" },
    { label: t("cmn.positions.middleLeft"), value: "middle-left" },
  ];

  return { tabs, fontWeightOptions, fontOptions, bubbleTabs, widgetPositions };
};
